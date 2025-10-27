import Image from "next/image";
import React from "react";

interface ActivityCardProps {
  image: string;
  title: string;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ image, title }) => {
  return (
    <div className="relative max-md:w-full">
      <Image width={827} height={464}
        src={image}
        alt={title}
        className="w-[827px] h-[464px] rounded-md max-md:w-full max-md:h-auto object-cover"
      />
      <h3 className="absolute text-[#2E2E2E] text-6xl font-semibold opacity-90 left-[63px] bottom-[42px] max-sm:text-[40px] max-sm:left-5 max-sm:bottom-5">
        {title}
      </h3>
    </div>
  );
};
