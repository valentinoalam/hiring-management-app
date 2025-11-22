// import Image from 'next/image';
import { cn } from '@/lib/utils.js';
import Image from 'next/image';
import Link from 'next/link';
interface LogoProps {
  className?: string;
  linkToHome?: boolean;
  withName?: boolean;
  width?: number;
  height?: number;
  size?: "small" | "medium" | "large";
}

const Logo = ({
  className, 
  width = 145, 
  height = 50, 
  size = "medium", 
  linkToHome = true,
  withName = true
}: LogoProps) => {
  const sizeClasses = {
    small: "h-6",
    medium: "h-8",
    large: "h-10",
  };
  const logoElement = (
      <div className={cn("relative flex items-center", className, sizeClasses[size])}>
        <div className='w-36 h-12 place-items-center'>
          <Image priority
            src="/logo+text.png"
            alt="Rakamin" width={width} height={height} placeholder="blur"
            blurDataURL={`${process.env.NEXT_PUBLIC_APP_URL}/logo+text.png`}
            style={{ width:width, height:height }}
            className="self-center aspect-auto object-cover transition-transform duration-300 transform drop-shadow-lg hover:scale-105"
          />
        </div>
        {withName && (
          <>
          <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/70 tracking-tight mr-1">
            Rakamin
          </span>
          </>
        )}
      </div>
  )
  return linkToHome ? (
    <Link href="/" className='self-center'>{logoElement}
    </Link>
  ) : (
    logoElement
  );
};
export default Logo;