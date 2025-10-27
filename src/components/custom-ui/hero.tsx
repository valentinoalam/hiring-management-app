import React from 'react'

const hero = () => {
  const activeJobs = []
  return (
        <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Careers at Rakamin</h1>
          <p className="text-lg text-gray-600 mb-6">
            Join our team and help us build the future of hiring management. 
            We&apos;re looking for talented individuals who are passionate about technology and innovation.
          </p>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700">
              {activeJobs.length}
            </span>
            <span>Open Position{activeJobs.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default hero