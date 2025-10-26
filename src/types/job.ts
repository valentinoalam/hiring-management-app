export interface Job {
  id: string
  title: string
  department: string
  status: 'Active' | 'Inactive' | 'Draft'
  salaryRange?: string
  config: {
    fullName?: 'mandatory' | 'optional' | 'off'
    email?: 'mandatory' | 'optional' | 'off'
    linkedin?: 'mandatory' | 'optional' | 'off'
    domicile?: 'mandatory' | 'optional' | 'off'
  }
}
