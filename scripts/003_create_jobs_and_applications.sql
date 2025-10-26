-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  department TEXT,
  location TEXT,
  salary_min DECIMAL(10, 2),
  salary_max DECIMAL(10, 2),
  employment_type TEXT DEFAULT 'Full-time',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create application form fields table
CREATE TABLE IF NOT EXISTS application_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  field_state TEXT NOT NULL DEFAULT 'optional' CHECK (field_state IN ('mandatory', 'optional', 'off')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  job_seeker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'rejected', 'accepted')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, job_seeker_id)
);

-- Create application responses table
CREATE TABLE IF NOT EXISTS application_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES application_form_fields(id) ON DELETE CASCADE,
  response_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jobs
CREATE POLICY "Recruiters can view their own jobs" ON jobs
  FOR SELECT USING (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can create jobs" ON jobs
  FOR INSERT WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can update their own jobs" ON jobs
  FOR UPDATE USING (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can delete their own jobs" ON jobs
  FOR DELETE USING (recruiter_id = auth.uid());

-- RLS Policies for application_form_fields
CREATE POLICY "Users can view form fields for jobs they have access to" ON application_form_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = application_form_fields.job_id 
      AND (jobs.recruiter_id = auth.uid() OR jobs.status = 'active')
    )
  );

CREATE POLICY "Recruiters can manage form fields for their jobs" ON application_form_fields
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = application_form_fields.job_id 
      AND jobs.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can update form fields for their jobs" ON application_form_fields
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = application_form_fields.job_id 
      AND jobs.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can delete form fields for their jobs" ON application_form_fields
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = application_form_fields.job_id 
      AND jobs.recruiter_id = auth.uid()
    )
  );

-- RLS Policies for applications
CREATE POLICY "Recruiters can view applications for their jobs" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = applications.job_id 
      AND jobs.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Job seekers can view their own applications" ON applications
  FOR SELECT USING (job_seeker_id = auth.uid());

CREATE POLICY "Job seekers can create applications" ON applications
  FOR INSERT WITH CHECK (job_seeker_id = auth.uid());

-- RLS Policies for application_responses
CREATE POLICY "Recruiters can view responses for their job applications" ON application_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications 
      JOIN jobs ON jobs.id = applications.job_id
      WHERE applications.id = application_responses.application_id 
      AND jobs.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Job seekers can view their own responses" ON application_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = application_responses.application_id 
      AND applications.job_seeker_id = auth.uid()
    )
  );

CREATE POLICY "Job seekers can create responses" ON application_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = application_responses.application_id 
      AND applications.job_seeker_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_application_form_fields_job_id ON application_form_fields(job_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_job_seeker_id ON applications(job_seeker_id);
CREATE INDEX idx_application_responses_application_id ON application_responses(application_id);
