export default function Footer() {
  return (
    <footer className="w-full bg-white px-6 lg:px-[208px] py-4">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-8 mb-6 pt-4">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-primary-surface"></div>
            <div className="w-6 h-6 rounded-full bg-primary-surface"></div>
            <div className="w-6 h-6 rounded-full bg-primary-surface flex items-center justify-center p-2"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          <div className="flex flex-col gap-2">
            <h3 className="text-primary font-bold text-sm leading-6 tracking-[0.2px]">
              PT. Rakamin Kolektif Madani
            </h3>
            <p className="text-neutral-80 text-sm leading-6">
              Eastlink Centre, Jl. Perserikatan No.01, RT.2/RW.8, Rawamangun, Kec.Pulo Gadung, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13220
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-primary font-bold text-sm leading-6 tracking-[0.2px]">
              Feature to Help You
            </h3>
            <div className="text-neutral-90 text-sm leading-6 space-y-0">
              <p>Explore course</p>
              <p>Virtual Working Experience</p>
              <p>Digital Career Profiler</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-primary font-bold text-sm leading-6 tracking-[0.2px]">
              Resources
            </h3>
            <div className="text-neutral-90 text-sm leading-6 space-y-0">
              <p>Refund Policies</p>
              <p>FAQ</p>
              <p>Privacy Policy and Terms of Use</p>
              <p>Job Connector</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-40">
          <p className="text-neutral-50 text-sm leading-6">
            © Rakamin Academy 2021. All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
