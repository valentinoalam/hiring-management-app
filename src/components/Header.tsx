export default function Header() {
  return (
    <header className="w-full bg-white shadow-md sticky top-0 z-50">
      <div className="flex justify-end items-center px-6 lg:px-[120px] py-3 gap-[300px]">
        <div className="flex items-center gap-4">
          <div className="w-px h-6 bg-neutral-40"></div>
          <div className="flex items-end gap-[-12px]">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/840300d7626ef49ec0e72333686898f54d4f2534?width=56"
              alt="User avatar"
              className="w-7 h-7 rounded-full border border-neutral-40"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
