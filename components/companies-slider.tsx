'use client';

import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Image from 'next/image';
import type { CompanyData } from '@/lib/types';

function CompaniesSlider({ companies }: { companies: CompanyData[] }) {
  const settings = {
    arrows: false,
    dots: false,
    infinite: true,
    slidesToShow: 8,
    slidesToScroll: 1,
    autoplay: true,
    speed: 3000,
    autoplaySpeed: 3000,
    cssEase: 'linear',
    pauseOnHover: false,
    start: 0,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          arrows: false,
          dots: false,
          infinite: true,
          slidesToShow: 5,
          slidesToScroll: 1,
          autoplay: true,
          speed: 3000,
          autoplaySpeed: 3000,
          cssEase: 'linear',
          pauseOnHover: false,
        },
      },
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          dots: false,
          infinite: true,
          slidesToShow: 4,
          slidesToScroll: 1,
          autoplay: true,
          speed: 3000,
          autoplaySpeed: 3000,
          cssEase: 'linear',
          pauseOnHover: false,
        },
      },
      {
        breakpoint: 480,
        settings: {
          arrows: false,
          dots: false,
          infinite: true,
          slidesToShow: 1,
          slidesToScroll: 3,
          autoplay: true,
          speed: 3000,
          autoplaySpeed: 3000,
          cssEase: 'linear',
          pauseOnHover: false,
        },
      },
    ],
  };

  return (
    <div className="container mx-auto mt-10 hidden max-w-full pt-2 pb-0 sm:block">
      <Slider {...settings}>
        {companies.map((company) => (
          <div key={company.name}>
            <Image
              src={company.logo}
              alt={company.name}
              height={80}
              width={80}
              className="h-24 w-32 rounded-xs opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
            />
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default CompaniesSlider;
