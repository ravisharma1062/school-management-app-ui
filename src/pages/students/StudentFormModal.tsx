import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { studentsApi } from '@/api/students';
import { usersApi } from '@/api/users';
import { extractErrorMessage } from '@/api/client';
import { Button, Input, Modal, Select } from '@/components/ui';
import type { StudentCreateRequest, StudentDto } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  student?: StudentDto | null; // when set → edit mode
}

const empty: StudentCreateRequest = {
  name: '',
  rollNo: '',
  studentClass: '',
  section: '',
  dob: '',
  parentId: undefined,
};

export function StudentFormModal({ open, onClose, student }: Props) {
  const { t } = useTranslation();
  const isEdit = !!student;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<StudentCreateRequest>(empty);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setForm(
        student
          ? {
              name: student.name,
              rollNo: student.rollNo,
              studentClass: student.studentClass,
              section: student.section,
              dob: student.dob,
              parentId: student.parentId ?? undefined,
            }
          : empty,
      );
    }
  }, [open, student]);

  // Parents for the assignment dropdown.
  const { data: parents } = useQuery({
    queryKey: ['users', 'PARENT', 'all'],
    queryFn: () => usersApi.list({ role: 'PARENT', size: 200 }),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (payload: StudentCreateRequest) =>
      isEdit ? studentsApi.update(student!.id, payload) : studentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      if (isEdit) queryClient.invalidateQueries({ queryKey: ['student', student!.id] });
      onClose();
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function update<K extends keyof StudentCreateRequest>(key: K, value: StudentCreateRequest[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate({ ...form, parentId: form.parentId || undefined });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('studentForm.editStudent') : t('studentForm.addStudent')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="student-form" loading={mutation.isPending}>
            {isEdit ? t('studentForm.saveChanges') : t('studentForm.createStudent')}
          </Button>
        </>
      }
    >
      <form id="student-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="animate-scale-in rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        <Input
          label={t('studentForm.fullName')}
          required
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('studentForm.rollNumber')}
            required
            value={form.rollNo}
            onChange={(e) => update('rollNo', e.target.value)}
          />
          <Input
            label={t('studentForm.dateOfBirth')}
            type="date"
            required
            value={form.dob}
            onChange={(e) => update('dob', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('studentForm.class')}
            required
            placeholder="e.g. 5"
            value={form.studentClass}
            onChange={(e) => update('studentClass', e.target.value)}
          />
          <Input
            label={t('studentForm.section')}
            required
            placeholder="e.g. A"
            value={form.section}
            onChange={(e) => update('section', e.target.value)}
          />
        </div>
        <Select
          label={t('studentForm.parentOptional')}
          value={form.parentId ?? ''}
          onChange={(e) => update('parentId', e.target.value || undefined)}
        >
          <option value="">{t('studentForm.noParentLinked')}</option>
          {parents?.content.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.email})
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  );
}
