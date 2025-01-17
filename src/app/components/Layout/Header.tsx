'use client';

import { useEffect, useState } from 'react';
import { ModeToggle } from '../../components/ModeSwitcher';
import { MainNav } from '../../components/Navigation/MainNav';
import { cn } from '../../lib/utils';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'border-grid container sticky top-0 z-50 mx-auto w-full max-w-[1500px] bg-transparent px-8 py-4 shadow-[0_0_2px_0_rgba(0,0,0,0.1)] transition-all duration-300',
        isScrolled && 'bg-background/80 py-3 shadow-[0_0_3px_0_rgba(0,0,0,0.1)] backdrop-blur'
      )}
    >
      <div className="mx-auto flex items-center justify-between">
        <svg className="max-h-5 w-auto" xmlns="http://www.w3.org/2000/svg" width="294" height="49" fill="none" viewBox="0 0 294 49">
          <g filter="url(#filter0_i_7830_99242)">
            <ellipse
              cx="10.679"
              cy="11.15"
              fill="color(display-p3 0.0118 0.4471 0.8824)"
              rx="10.679"
              ry="11.15"
              transform="matrix(-1 0 0 1 47.792 0)"
            ></ellipse>
          </g>
          <g filter="url(#filter1_i_7830_99242)">
            <path
              fill="color(display-p3 0.8314 0.5882 0.9451)"
              d="M47.793 42.109a6.37 6.37 0 0 1-6.372 6.371H29.995a3.56 3.56 0 0 1-3.56-3.56V32.283a6.1 6.1 0 0 1 6.102-6.103c8.426 0 15.255 6.83 15.255 15.256z"
            ></path>
          </g>
          <path
            fill="#000"
            fillRule="evenodd"
            d="M4.153 0A3.717 3.717 0 0 0 .436 3.717v.786c0 9.206 6.989 16.78 15.95 17.703.178 1.33.146 2.702-.093 4.003a6 6 0 0 0-.602-.03C7.266 26.18.436 33.01.436 41.436v.674a6.37 6.37 0 0 0 6.372 6.371h11.425a3.56 3.56 0 0 0 3.56-3.559V6.102c0-1.96 0-2.94-.336-3.706a4 4 0 0 0-2.06-2.06C18.63 0 17.651 0 15.691 0z"
            clipRule="evenodd"
          ></path>
          <path
            fill="#000"
            d="M293.45 10.443c-3.486-.311-5.788.747-5.788 4.357h5.788v8.962h-5.788V45.92h-9.336V23.762h-4.17V14.8h4.17c0-8.714 4.792-13.942 15.124-13.32zM270.929 10.443c-3.486-.311-5.788.747-5.788 4.357h5.788v8.962h-5.788V45.92h-9.336V23.762h-4.17V14.8h4.17c0-8.714 4.792-13.942 15.124-13.32zM233.574 46.79c-9.149 0-16.493-7.157-16.493-16.43s7.344-16.432 16.493-16.432 16.493 7.158 16.493 16.431-7.344 16.431-16.493 16.431m0-9.087c4.045 0 7.157-2.925 7.157-7.344s-3.112-7.344-7.157-7.344c-4.046 0-7.158 2.925-7.158 7.344s3.112 7.344 7.158 7.344M203.073 2.352h9.336V45.92h-9.336v-2.925c-2.054 2.365-5.104 3.797-9.274 3.797-8.153 0-14.875-7.158-14.875-16.431s6.722-16.431 14.875-16.431c4.17 0 7.22 1.431 9.274 3.796zm-7.407 35.6c4.295 0 7.407-2.924 7.407-7.592s-3.112-7.593-7.407-7.593c-4.294 0-7.406 2.925-7.406 7.593s3.112 7.593 7.406 7.593M163.054 13.928c6.286 0 11.638 4.481 11.638 12.884v19.107h-9.335V28.18c0-3.859-2.428-5.664-5.415-5.664-3.423 0-5.788 1.992-5.788 6.41V45.92h-9.336v-31.12h9.336v2.926c1.68-2.303 4.792-3.797 8.9-3.797M129.255 14.8h9.336v31.119h-9.336v-2.925c-2.054 2.365-5.104 3.796-9.274 3.796-8.153 0-14.875-7.157-14.875-16.43s6.722-16.432 14.875-16.432c4.17 0 7.22 1.432 9.274 3.797zm-7.406 23.152c4.294 0 7.406-2.925 7.406-7.593s-3.112-7.593-7.406-7.593c-4.295 0-7.407 2.925-7.407 7.593s3.112 7.593 7.407 7.593M89.236 13.929c6.286 0 11.638 4.48 11.638 12.883v19.107h-9.335V28.181c0-3.858-2.428-5.663-5.415-5.663-3.423 0-5.788 1.991-5.788 6.41V45.92H71V2.352h9.336v15.373c1.68-2.303 4.792-3.796 8.9-3.796"
          ></path>
          <defs>
            <filter
              id="filter0_i_7830_99242"
              width="21.357"
              height="23.301"
              x="26.436"
              y="0"
              colorInterpolationFilters="sRGB"
              filterUnits="userSpaceOnUse"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend>
              <feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"></feColorMatrix>
              <feOffset dy="1"></feOffset>
              <feGaussianBlur stdDeviation="1.5"></feGaussianBlur>
              <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic"></feComposite>
              <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"></feColorMatrix>
              <feBlend in2="shape" result="effect1_innerShadow_7830_99242"></feBlend>
            </filter>
            <filter
              id="filter1_i_7830_99242"
              width="21.357"
              height="23.301"
              x="26.436"
              y="26.179"
              colorInterpolationFilters="sRGB"
              filterUnits="userSpaceOnUse"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend>
              <feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"></feColorMatrix>
              <feOffset dy="1"></feOffset>
              <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic"></feComposite>
              <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"></feColorMatrix>
              <feBlend in2="shape" result="effect1_innerShadow_7830_99242"></feBlend>
            </filter>
          </defs>
        </svg>
        <div className="flex items-center gap-4">
          <MainNav />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
