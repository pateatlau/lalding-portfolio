'use client';

import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Image from 'next/image';
import { companiesSliderData } from '@/lib/data';

function CompaniesSlider() {
  const settings = {
    arrows: false,
    dots: false,
    infinite: true,
    slidesToShow: 10,
    slidesToScroll: 1,
    autoplay: true,
    speed: 3000,
    autoplaySpeed: 3000,
    cssEase: 'linear',
    pauseOnHover: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          arrows: false,
          dots: false,
          infinite: true,
          slidesToShow: 6,
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
          slidesToShow: 2,
          slidesToScroll: 1,
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
    <div className="container pt-2 pb-0 mt-10 hidden sm:block">
      <Slider {...settings}>
        {companiesSliderData.map((company) => (
          <div key={company.name}>
            <Image
              src={company.logo}
              alt={company.name}
              width={80}
              height={80}
              className="rounded-md w-28 h-28"
            />
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default CompaniesSlider;
