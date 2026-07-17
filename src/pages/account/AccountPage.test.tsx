import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountPage } from './AccountPage';
import { subscriptionApi } from '@/api/subscription';
import { billingApi } from '@/api/billing';
import { dataExportApi } from '@/api/dataExport';
import { brandingApi } from '@/api/branding';
import type { Page, PaymentClaimDto, SubscriptionDto } from '@/types';
import '@/i18n';

vi.mock('@/api/subscription', () => ({ subscriptionApi: { getCurrent: vi.fn() } }));
vi.mock('@/api/billing', () => ({
  billingApi: { getPaymentInstructions: vi.fn(), submitPayment: vi.fn(), getMyHistory: vi.fn() },
}));
vi.mock('@/api/dataExport', () => ({ dataExportApi: { download: vi.fn() } }));
vi.mock('@/api/branding', () => ({
  brandingApi: { getCurrent: vi.fn(), getLogoObjectUrl: vi.fn(), uploadLogo: vi.fn(), updateColors: vi.fn() },
}));

const brandingState = vi.hoisted(() => ({
  branding: null as { hasLogo: boolean; primaryColor: string | null; secondaryColor: string | null } | null,
  logoUrl: null as string | null,
  refetch: vi.fn(),
}));
vi.mock('@/context/BrandingContext', () => ({
  useBranding: () => brandingState,
}));

const mockedSubscriptionApi = vi.mocked(subscriptionApi);
const mockedBillingApi = vi.mocked(billingApi);
const mockedDataExportApi = vi.mocked(dataExportApi);
const mockedBrandingApi = vi.mocked(brandingApi);

const SUBSCRIPTION: SubscriptionDto = {
  planCode: 'STANDARD',
  planName: 'Standard',
  status: 'ACTIVE',
  trialEndsAt: null,
  currentPeriodEnd: '2026-12-31',
  entitlements: [
    { featureKey: 'BRANDING', enabled: true, limitValue: null, currentUsage: null },
    { featureKey: 'MAX_STUDENTS', enabled: true, limitValue: 500, currentUsage: 120 },
  ],
};

const EMPTY_HISTORY: Page<PaymentClaimDto> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 20,
  number: 0,
  first: true,
  last: true,
  numberOfElements: 0,
  empty: true,
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AccountPage />
    </QueryClientProvider>,
  );
}

function setupDefaults() {
  mockedSubscriptionApi.getCurrent.mockResolvedValue(SUBSCRIPTION);
  mockedBillingApi.getPaymentInstructions.mockResolvedValue('Pay via NEFT to account 12345.');
  mockedBillingApi.getMyHistory.mockResolvedValue(EMPTY_HISTORY);
  brandingState.branding = { hasLogo: false, primaryColor: null, secondaryColor: null };
  brandingState.logoUrl = null;
}

describe('AccountPage', () => {
  it('shows a loading state before the subscription resolves', () => {
    mockedSubscriptionApi.getCurrent.mockReturnValue(new Promise(() => {})); // never resolves
    renderPage();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows an error state with retry when the subscription fails to load', async () => {
    mockedSubscriptionApi.getCurrent.mockRejectedValue(new Error('network down'));
    renderPage();
    expect(await screen.findByText('network down')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('renders plan, status and entitlements once loaded', async () => {
    setupDefaults();
    renderPage();

    expect(await screen.findByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Renews / ends')).toBeInTheDocument();
    expect(screen.getByText('Student limit')).toBeInTheDocument();
    expect(screen.getByText('120 / 500')).toBeInTheDocument();
  });

  it('renders the branding section as editable when BRANDING is entitled', async () => {
    setupDefaults();
    renderPage();

    await screen.findByText('Standard');
    expect(screen.getByText('No logo uploaded yet')).toBeInTheDocument();
    expect(screen.queryByText("Custom branding isn't included in your current plan.")).not.toBeInTheDocument();
  });

  it('shows the not-entitled message when BRANDING is disabled', async () => {
    mockedSubscriptionApi.getCurrent.mockResolvedValue({
      ...SUBSCRIPTION,
      entitlements: [{ featureKey: 'BRANDING', enabled: false, limitValue: null, currentUsage: null }],
    });
    mockedBillingApi.getPaymentInstructions.mockResolvedValue('Pay via NEFT.');
    mockedBillingApi.getMyHistory.mockResolvedValue(EMPTY_HISTORY);
    brandingState.branding = { hasLogo: false, primaryColor: null, secondaryColor: null };
    brandingState.logoUrl = null;
    renderPage();

    await screen.findByText('Standard');
    expect(screen.getByText("Custom branding isn't included in your current plan.")).toBeInTheDocument();
    expect(screen.queryByText('No logo uploaded yet')).not.toBeInTheDocument();
  });

  it('submits a billing payment claim and clears the form on success', async () => {
    setupDefaults();
    const created: PaymentClaimDto = {
      id: 'c1',
      amount: 500,
      method: 'NEFT',
      referenceNumber: 'UTR123',
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
      status: 'PENDING_VERIFICATION',
      submittedAt: '2026-02-01T10:00:00Z',
      verifiedAt: null,
      notes: null,
    };
    mockedBillingApi.submitPayment.mockResolvedValue(created);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Standard');
    await user.type(screen.getByLabelText('Amount', { exact: false }), '500');
    await user.type(screen.getByLabelText('Reference number (UTR / cheque / DD number)', { exact: false }), 'UTR123');
    await user.type(screen.getByLabelText('Period end', { exact: false }), '2026-01-31');
    await user.click(screen.getByRole('button', { name: 'Report payment' }));

    await waitFor(() =>
      expect(mockedBillingApi.submitPayment).toHaveBeenCalledWith({
        amount: 500,
        method: 'NEFT',
        referenceNumber: 'UTR123',
        periodStart: expect.any(String),
        periodEnd: '2026-01-31',
      }),
    );
  });

  it('shows a billing error message when the payment claim submission fails', async () => {
    setupDefaults();
    mockedBillingApi.submitPayment.mockRejectedValue(new Error('Reference number already used'));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Standard');
    await user.type(screen.getByLabelText('Amount', { exact: false }), '500');
    await user.type(screen.getByLabelText('Reference number (UTR / cheque / DD number)', { exact: false }), 'DUP1');
    await user.type(screen.getByLabelText('Period end', { exact: false }), '2026-01-31');
    await user.click(screen.getByRole('button', { name: 'Report payment' }));

    expect(await screen.findByText('Reference number already used')).toBeInTheDocument();
  });

  it('renders payment history rows once loaded', async () => {
    setupDefaults();
    mockedBillingApi.getMyHistory.mockResolvedValue({
      ...EMPTY_HISTORY,
      content: [
        {
          id: 'c1',
          amount: 250,
          method: 'CHEQUE',
          referenceNumber: 'CHQ001',
          periodStart: '2026-01-01',
          periodEnd: '2026-01-31',
          status: 'VERIFIED',
          submittedAt: '2026-02-01T10:00:00Z',
          verifiedAt: '2026-02-02T10:00:00Z',
          notes: null,
        },
      ],
      totalElements: 1,
      numberOfElements: 1,
      empty: false,
    });
    renderPage();

    await screen.findByText('Standard');
    expect(await screen.findByText('Verified')).toBeInTheDocument();
    const historyTable = screen.getByRole('table');
    expect(within(historyTable).getByText('Cheque')).toBeInTheDocument();
  });

  it('downloads the data export on button click', async () => {
    setupDefaults();
    const blob = new Blob(['zip-bytes']);
    mockedDataExportApi.download.mockResolvedValue(blob);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Standard');
    await user.click(screen.getByRole('button', { name: 'Download export' }));

    await waitFor(() => expect(mockedDataExportApi.download).toHaveBeenCalledTimes(1));
  });

  it('shows an error message when the data export download fails', async () => {
    setupDefaults();
    mockedDataExportApi.download.mockRejectedValue(new Error('Export failed'));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Standard');
    await user.click(screen.getByRole('button', { name: 'Download export' }));

    expect(await screen.findByText('Export failed')).toBeInTheDocument();
  });

  it('uploads a logo and refetches branding on success', async () => {
    setupDefaults();
    mockedBrandingApi.uploadLogo.mockResolvedValue({ hasLogo: true, primaryColor: null, secondaryColor: null });
    brandingState.refetch = vi.fn();
    renderPage();

    await screen.findByText('Standard');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['logo-bytes'], 'logo.png', { type: 'image/png' });
    const user = userEvent.setup();
    await user.upload(fileInput, file);

    await waitFor(() => expect(mockedBrandingApi.uploadLogo).toHaveBeenCalledWith(file));
    await waitFor(() => expect(brandingState.refetch).toHaveBeenCalled());
  });

  it('saves brand colors and shows a confirmation', async () => {
    setupDefaults();
    mockedBrandingApi.updateColors.mockResolvedValue({
      hasLogo: false,
      primaryColor: '#111111',
      secondaryColor: '#222222',
    });
    brandingState.refetch = vi.fn();
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Standard');
    await user.click(screen.getByRole('button', { name: 'Save colors' }));

    await waitFor(() => expect(mockedBrandingApi.updateColors).toHaveBeenCalled());
    expect(await screen.findByText('Branding updated.')).toBeInTheDocument();
  });
});
