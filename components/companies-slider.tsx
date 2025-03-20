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
  };
  return (
    <div className="container hidden lg:block pt-2 pb-0 mt-10">
      <Slider {...settings}>
        {companiesSliderData.map((company) => (
          <div key={company.name}>
            <Image
              src={company.logo}
              alt={company.name}
              width={80}
              height={80}
              className="rounded-md"
            />
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default CompaniesSlider;
