import { useQuery } from '@tanstack/react-query';
import { studentsApi } from '@/api/students';
import { useAuth } from '@/context/AuthContext';
import { Input, Select } from '@/components/ui';

export interface ClassSection {
  studentClass: string;
  section: string;
}

/**
 * Lets a user choose a class + section.
 * - Parents pick from a dropdown derived from their own children.
 * - Staff (admin/teacher) type the class and section directly.
 */
export function ClassSectionPicker({
  value,
  onChange,
}: {
  value: ClassSection;
  onChange: (v: ClassSection) => void;
}) {
  const { role } = useAuth();

  const childrenQuery = useQuery({
    queryKey: ['my-children'],
    queryFn: () => studentsApi.myChildren(),
    enabled: role === 'PARENT',
  });

  if (role === 'PARENT') {
    const options = Array.from(
      new Map(
        (childrenQuery.data ?? []).map((c) => [`${c.studentClass}|${c.section}`, c]),
      ).values(),
    );
    const current = `${value.studentClass}|${value.section}`;
    return (
      <div className="w-64">
        <Select
          label="Class / Section"
          value={options.some((o) => `${o.studentClass}|${o.section}` === current) ? current : ''}
          onChange={(e) => {
            const [studentClass, section] = e.target.value.split('|');
            onChange({ studentClass: studentClass ?? '', section: section ?? '' });
          }}
        >
          <option value="">— Select —</option>
          {options.map((o) => (
            <option key={`${o.studentClass}|${o.section}`} value={`${o.studentClass}|${o.section}`}>
              Class {o.studentClass}-{o.section}
            </option>
          ))}
        </Select>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="w-32">
        <Input
          label="Class"
          placeholder="e.g. 5"
          value={value.studentClass}
          onChange={(e) => onChange({ ...value, studentClass: e.target.value })}
        />
      </div>
      <div className="w-32">
        <Input
          label="Section"
          placeholder="e.g. A"
          value={value.section}
          onChange={(e) => onChange({ ...value, section: e.target.value })}
        />
      </div>
    </div>
  );
}
