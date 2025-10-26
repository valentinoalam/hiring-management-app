import React from "react";

interface NewsCardProps {
  image: string;
  title: string;
  description: string;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  image,
  title,
  description,
}) => {
  return (
    <div className="flex flex-col gap-[42px] shadow-[0px_10px_33px_#F3F3F3] bg-white rounded-[20px] max-md:w-full">
      <img
        src={image}
        alt={title}
        className="w-[752px] h-[411px] rounded-[20px_20px_0_0] max-md:w-full max-md:h-auto object-cover"
      />
      <div className="flex flex-col gap-[50px] px-[50px] py-5 max-sm:p-[15px]">
        <h3 className="text-[#2E2E2E] text-[40px] font-bold leading-[55px] tracking-[0.088px] max-sm:text-3xl">
          {title}
        </h3>
        <div className="w-[610px] h-px bg-[rgba(0,0,0,0.20)]" />
        <p className="text-[rgba(0,0,0,0.30)] text-2xl font-normal leading-9 tracking-[0.046px]">
          {description}
        </p>
        <button className="w-[342px] h-[90px] text-white text-3xl font-semibold tracking-[0.08em] cursor-pointer flex items-center justify-center gap-2.5 bg-[#B37437] rounded-[10px] border-[none] max-sm:w-full">
          <span>READ MORE</span>
          <i className="ti ti-arrow-right" />
        </button>
      </div>
    </div>
  );
};
