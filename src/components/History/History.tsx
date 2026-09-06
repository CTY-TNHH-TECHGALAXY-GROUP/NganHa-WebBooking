'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { useTranslation } from '@/components/TranslationProvider';
import {
  HISTORY_CHAPTER_TRANSLATIONS,
  HISTORY_FINALE_DEFAULTS,
  HISTORY_HERO_DEFAULTS,
  HISTORY_INTERFACE_COPY,
  HISTORY_LOCALES,
  type HistoryLocale,
} from './History.localization';
import styles from './History.module.css';

type Scene = {
  title: string;
  label: string;
  body: string;
  image: string;
  alt: string;
  imageFit?: CSSProperties['objectFit'];
  imagePosition?: CSSProperties['objectPosition'];
};

type Chapter = {
  year: string;
  eyebrow: string;
  title: string;
  body: string;
  meta: string[];
  scenes: Scene[];
};

export const chaptersVi: Chapter[] = [
  {
    year: '2015',
    eyebrow: 'Foundation',
    title: 'Khởi đầu của một điểm đến chăm sóc sắc đẹp',
    body: 'Một không gian nhỏ, một đội ngũ đầu tiên và lời hứa về chất lượng được xây từ từng chi tiết phục vụ. Đây là chương mở đầu của Ngân Hà.',
    meta: ['Cửa hàng đầu tiên', 'Đội ngũ khởi đầu', 'Khai trương'],
    scenes: [
      {
        title: 'Hình ảnh cửa hàng Ngân Hà những ngày đầu',
        label: 'First salon',
        body: 'Tư liệu mặt tiền Beauty Salon Ngân Hà ghi lại giai đoạn khởi đầu, khi thương hiệu còn được xây dựng từ từng khách hàng quen và từng dịch vụ chăm sóc nhỏ.',
        image: '/images/history/2015-ngan-ha-storefront.png',
        alt: 'Mặt tiền Beauty Salon Ngân Hà những ngày đầu',
      },
      {
        title: 'Lời cam kết chất lượng đầu tiên',
        label: 'Commitment',
        body: 'Bảng cam kết sử dụng sản phẩm chất lượng cho khách hàng thể hiện tinh thần chăm sóc tử tế đã có từ những ngày đầu.',
        image: '/images/history/2015-ngan-ha-commitment-flowers.png',
        alt: 'Bảng cam kết chất lượng và hoa chúc mừng của Beauty Salon Ngân Hà',
      },
      {
        title: 'Đội ngũ Ngân Hà trong ngày khai trương',
        label: 'Team',
        body: 'Khoảnh khắc đội ngũ đứng cùng nhau tại cửa tiệm ghi lại tinh thần khởi đầu: chỉn chu, gần gũi và cùng hướng về trải nghiệm khách hàng.',
        image: '/images/history/2015-ngan-ha-team.png',
        alt: 'Đội ngũ Beauty Salon Ngân Hà trong giai đoạn khai trương',
      },
    ],
  },
  {
    year: '2018',
    eyebrow: 'Presence',
    title: 'Thương hiệu trở nên rõ nét hơn trong mắt khách hàng',
    body: 'Ở mốc 2018, nhận diện Ngân Hà trở nên vững vàng hơn: mặt tiền sáng hơn, quy trình rõ hơn và trải nghiệm bắt đầu có nét riêng.',
    meta: ['Nhận diện', 'Mặt tiền', 'Dịch vụ ổn định'],
    scenes: [
      {
        title: 'Mặt tiền Ngân Hà ban ngày',
        label: 'Facade day',
        body: 'Hình ảnh mặt tiền Beauty Salon Ngân Hà tại 62A Hồ Hảo Hớn cho thấy nhận diện thương hiệu đã rõ ràng và dễ nhận ra hơn.',
        image: '/images/history/2018-ngan-ha-facade-day.png',
        alt: 'Mặt tiền Beauty Salon Ngân Hà ban ngày năm 2018',
      },
      {
        title: 'Không gian chăm sóc tóc đầu tiên',
        label: 'Salon station',
        body: 'Khu ghế làm tóc và kệ sản phẩm ghi lại giai đoạn dịch vụ salon được tổ chức chỉn chu hơn.',
        image: '/images/history/2018-ngan-ha-salon-station-compact.png',
        alt: 'Không gian ghế làm tóc và kệ sản phẩm của Ngân Hà',
      },
      
      {
        title: 'Mặt tiền Ngân Hà về đêm',
        label: 'Facade night',
        body: 'Biển hiệu sáng rõ về đêm giúp thương hiệu nổi bật hơn trên tuyến phố và dễ được khách hàng ghi nhớ.',
        image: '/images/history/2018-ngan-ha-facade-night.png',
        alt: 'Mặt tiền Beauty Salon Ngân Hà về đêm tại Hồ Hảo Hớn',
      },
    ],
  },
  {
    year: '2020',
    eyebrow: 'Growth',
    title: 'Đội ngũ và trải nghiệm không gian cùng trưởng thành',
    body: 'Câu chuyện thương hiệu không còn chỉ nằm ở hình ảnh bên ngoài. Con người, phong cách phục vụ và không gian trải nghiệm bắt đầu đồng bộ hơn.',
    meta: ['Đội ngũ', 'Không gian', 'Chuyên nghiệp'],
    scenes: [
      {
        title: 'Bảng hiệu Salon Ngân Hà',
        label: 'Signboard',
        body: 'Bảng hiệu mặt tiền nhấn mạnh các dịch vụ hair wash, ear wax và combo, giúp khách nhận diện rõ hơn khi ghé cơ sở Nguyễn Cư Trinh.',
        image: '/images/history/2020-ngan-ha-salon-signboard.png',
        alt: 'Bảng hiệu Salon Ngân Hà tại Nguyễn Cư Trinh năm 2020',
      },
      {
        title: 'Đội ngũ trong đồng phục xanh',
        label: 'Team blue',
        body: 'Khoảnh khắc tập thể trong đồng phục xanh ghi lại tinh thần vận hành đồng bộ và chuyên nghiệp hơn của Ngân Hà.',
        image: '/images/history/2020-ngan-ha-team-blue.png',
        alt: 'Đội ngũ Ngân Hà trong đồng phục xanh năm 2020',
      },
      {
        title: 'Không gian đón khách sáng hơn',
        label: 'Entrance',
        body: 'Không gian bên trong được mở rộng với ánh sáng, ghế chờ và bố cục đón khách rõ ràng hơn.',
        image: '/images/history/2020-ngan-ha-interior-entrance.png',
        alt: 'Không gian đón khách Ngân Hà năm 2020',
      },
      {
        title: 'Đội ngũ áo dài tại không gian Sài Gòn xưa',
        label: 'Ao dai team',
        body: 'Hình ảnh đội ngũ trong áo dài nhiều màu thể hiện một giai đoạn Ngân Hà chăm chút hơn cho bản sắc và trải nghiệm thương hiệu.',
        image: '/images/history/2020-ngan-ha-team-ao-dai.png',
        alt: 'Đội ngũ Ngân Hà mặc áo dài trong không gian Sài Gòn xưa năm 2020',
      },
    ],
  },
  {
    year: '2021',
    eyebrow: 'Expansion',
    title: 'Một địa chỉ mới với dấu ấn nhận diện mạnh hơn',
    body: 'Năm 2021 ghi lại giai đoạn Ngân Hà mở rộng không gian phục vụ và làm rõ hơn nhận diện tại cơ sở Ngô Đức Kế.',
    meta: ['Ngô Đức Kế', 'Bảng hiệu', 'Không gian dịch vụ'],
    scenes: [
      {
        title: 'Bảng hiệu vàng tại 11 Ngô Đức Kế',
        label: 'Gold facade',
        body: 'Bảng hiệu vàng lớn giúp cơ sở Ngô Đức Kế nổi bật hơn trên phố, đồng thời thể hiện rõ các dịch vụ chủ lực: hair, nail, ear wax, foot và body.',
        image: '/images/history/2021-ngan-ha-ngo-duc-ke-gold-sign.png',
        alt: 'Bảng hiệu vàng Beauty Salon Ngân Hà tại 11 Ngô Đức Kế năm 2021',
      },
      
      
      {
        title: 'Phòng trị liệu ấm hơn và riêng tư hơn',
        label: 'Therapy room',
        body: 'Không gian giường trị liệu với ánh sáng dịu và chất liệu ấm áp cho thấy trải nghiệm chăm sóc cơ thể được đầu tư rõ hơn.',
        image: '/images/history/2021-ngan-ha-treatment-beds.png',
        alt: 'Phòng trị liệu Ngân Hà với giường massage năm 2021',
      },
      {
        title: 'Không gian dịch vụ trong giờ hoạt động',
        label: 'Guest service',
        body: 'Hình ảnh khách đang được phục vụ cho thấy nhịp vận hành thực tế của salon: sáng, sạch và gần gũi hơn trong trải nghiệm hằng ngày.',
        image: '/images/history/2021-ngan-ha-service-floor-guests.png',
        alt: 'Không gian dịch vụ Ngân Hà đang phục vụ khách năm 2021',
      },
      
    ],
  },
  {
    year: '2023',
    eyebrow: 'Branch 2',
    title: 'Chi nhánh Thi Sách mở thêm một nhịp phục vụ mới',
    body: 'Từ bộ menu nhận diện Sauna Salon đến mặt tiền 6B Thi Sách, thương hiệu bước sang giai đoạn mở rộng rõ hơn về địa điểm, quy mô và cách giới thiệu dịch vụ.',
    meta: ['Chi nhánh 2', 'Thi Sách', 'Sauna Salon'],
    scenes: [
      {
        title: 'Mặt tiền chi nhánh 6B Thi Sách',
        label: 'Thi Sach',
        body: 'Hình ảnh mặt tiền chi nhánh thứ hai cho thấy thương hiệu đã hiện diện rõ hơn tại khu trung tâm, phục vụ nhóm khách tìm massage, ear wax và chăm sóc thư giãn.',
        image: '/images/history/2023-ngan-ha-branch-2-thi-sach-facade.png',
        alt: 'Mặt tiền chi nhánh Ngân Hà tại 6B Thi Sách',
      },
      {
        title: 'Menu nhận diện của chi nhánh Thi Sách',
        label: 'Branch menu',
        body: 'Cuốn menu gỗ đặt trong không gian spa ghi lại cách Ngân Hà giới thiệu đồng thời hai địa chỉ, trong đó chi nhánh Thi Sách trở thành điểm mở rộng quan trọng.',
        image: '/images/history/2023-ngan-ha-branch-2-menu-boo.png',
        alt: 'Menu gỗ Ngân Hà Sauna Salon giới thiệu chi nhánh Thi Sách',
      },
    ],
  },
  {
    year: '2024',
    eyebrow: 'Recognition',
    title: 'Bảng hiệu mới, không gian mới và dấu ấn được nhắc tới nhiều hơn',
    body: 'Sau khi cập nhật bảng hiệu và làm mới không gian, Ngân Hà có nhiều tư liệu hơn từ trải nghiệm thực tế, bài review và các kênh gợi ý dịch vụ.',
    meta: ['Bảng hiệu mới', 'Không gian mới', 'Review'],
    scenes: [
      {
        title: 'Bảng hiệu mới tại Ngô Đức Kế',
        label: 'New sign',
        body: 'Mặt tiền được cập nhật giúp địa chỉ 11 Ngô Đức Kế trông rõ ràng, hiện đại và dễ nhận diện hơn từ phía đường.',
        image: '/images/history/2024-ngan-ha-ngo-duc-ke-new-signboard.png',
        alt: 'Bảng hiệu mới của Ngân Hà tại 11 Ngô Đức Kế',
      },
      {
        title: 'Không gian bên trong sau khi nâng cấp',
        label: 'Updated space',
        body: 'Các ghế dịch vụ, khu chờ và ánh sáng được sắp xếp lại để tạo cảm giác sạch, sáng và chuyên nghiệp hơn.',
        image: '/images/history/2024-ngan-ha-updated-interior-space.png',
        alt: 'Không gian bên trong Ngân Hà sau khi cập nhật',
      },
      {
        title: 'Được nhắc tới trong danh sách gợi ý dịch vụ',
        label: 'Media mention',
        body: 'Tư liệu từ trang gợi ý địa chỉ lấy ráy tai an toàn tại Sài Gòn cho thấy dịch vụ của Ngân Hà bắt đầu có thêm độ nhận diện online.',
        image: '/images/history/2024-ngan-ha-hcmtoplist-feature.png',
        alt: 'Bài viết giới thiệu Salon Ngân Hà trong danh sách địa chỉ lấy ráy tai tại Sài Gòn',
        imageFit: 'contain',
        imagePosition: 'center top',
      },
      {
        title: 'Bài blog nhận diện Salon Ngân Hà',
        label: 'Blog mention',
        body: 'Ảnh chụp bài blog ghi lại mặt tiền Beauty Salon Ngân Hà cùng phần mô tả trải nghiệm, giúp câu chuyện nhận diện online rõ ràng hơn.',
        image: '/images/history/2024-ngan-ha-naver-recognition-blog.png',
        alt: 'Ảnh chụp bài blog nhận diện Beauty Salon Ngân Hà',
      },
      {
        title: 'Bài review kể lại trải nghiệm tại TP.HCM',
        label: 'Travel blog',
        body: 'Nội dung review nhắc tới dịch vụ massage tại Hồ Chí Minh và vị trí của Ngân Hà, bổ sung một lớp bằng chứng từ trải nghiệm thực tế.',
        image: '/images/history/2024-ngan-ha-naver-review-street.png',
        alt: 'Screenshot bài review quốc tế về dịch vụ massage Ngân Hà tại TP.HCM',
      },
    ],
  },
  {
    year: '2026',
    eyebrow: 'Brand Sync',
    title: 'Đồng bộ thương hiệu Oria và mở rộng sang FnB',
    body: 'Năm 2026 đánh dấu bước chuyển nhận diện rõ hơn: Oria Spa được đặt trong hệ sinh thái TechGalaxy Group, đồng thời mở thêm nhánh FnB với OriaFarm Store.',
    meta: ['Oria Spa', 'OriaFarm Store', 'FnB'],
    scenes: [
      {
        title: 'Bảng hiệu Oria Spa by TechGalaxy Group',
        label: 'Brand sync',
        body: 'Bảng hiệu Oria Spa tại 11 Ngô Đức Kế thể hiện bước đồng bộ thương hiệu mới, giữ tinh thần chăm sóc nhưng đưa tên Oria lên rõ ràng và hiện đại hơn.',
        image: '/images/history/2026-oria-spa-tech-galaxy-sign.png',
        alt: 'Bảng hiệu Oria Spa by TechGalaxy Group tại 11 Ngô Đức Kế năm 2026',
      },
      {
        title: 'OriaFarm Store mở rộng ngành FnB',
        label: 'FnB storefront',
        body: 'Mặt tiền OriaFarm Store giới thiệu một nhánh trải nghiệm mới trong hệ sinh thái Oria: đồ uống, trái cây và sản phẩm tươi phục vụ nhu cầu hằng ngày.',
        image: '/images/history/2026-oriafarm-storefront.png',
        alt: 'Mặt tiền OriaFarm Store năm 2026',
        imagePosition: 'center top',
      },
      {
        title: 'Không gian trái cây và đồ uống OriaFarm Store',
        label: 'Fresh bar',
        body: 'Tủ trái cây, rau củ và dòng sản phẩm Rainbow Cup cho thấy định hướng FnB tươi, sáng và gần gũi hơn trong hành trình mở rộng của thương hiệu.',
        image: '/images/history/2026-oriafarm-fnb-display.png',
        alt: 'Tủ trái cây và đồ uống OriaFarm Store năm 2026',
      },
    ],
  },
];

export const chaptersEn: Chapter[] = [
  {
    year: '2015',
    eyebrow: 'Foundation',
    title: 'The beginning of a beauty and wellness destination',
    body: 'A small space, a first team, and a promise of quality shaped through daily service details. This was the opening chapter of Ngan Ha.',
    meta: ['First store', 'Founding team', 'Opening'],
    scenes: [
      {
        title: 'Ngân Hà salon in the early days',
        label: 'First salon',
        body: 'This storefront archive captures the beginning of Beauty Salon Ngân Hà, when the brand was built through familiar guests and careful daily service.',
        image: '/images/history/2015-ngan-ha-storefront.png',
        alt: 'Beauty Salon Ngan Ha storefront in the early days',
      },
      {
        title: 'The first quality commitment',
        label: 'Commitment',
        body: 'The quality pledge for guests reflects the caring service spirit that shaped the brand from the start.',
        image: '/images/history/2015-ngan-ha-commitment-flowers.png',
        alt: 'Beauty Salon Ngan Ha quality commitment and congratulatory flowers',
      },
      {
        title: 'The Ngân Hà opening team',
        label: 'Team',
        body: 'This team moment at the salon entrance preserves the opening spirit: polished, welcoming, and focused on the guest experience.',
        image: '/images/history/2015-ngan-ha-team.png',
        alt: 'Beauty Salon Ngan Ha team during the opening period',
      },
    ],
  },
  {
    year: '2018',
    eyebrow: 'Presence',
    title: 'The brand became more recognizable',
    body: 'By 2018, Ngan Ha had a stronger identity: brighter frontage, clearer operations, and a more memorable service rhythm.',
    meta: ['Identity', 'Facade', 'Stable service'],
    scenes: [
      {
        title: 'Ngân Hà daytime facade',
        label: 'Facade day',
        body: 'The daytime storefront at 62A Ho Hao Hon shows a clearer, more recognizable salon identity.',
        image: '/images/history/2018-ngan-ha-facade-day.png',
        alt: 'Beauty Salon Ngan Ha daytime facade in 2018',
      },
      {
        title: 'The first hair service stations',
        label: 'Salon station',
        body: 'The styling chairs and product shelves capture a period when the salon services became more organized.',
        image: '/images/history/2018-ngan-ha-salon-station-compact.png',
        alt: 'Ngan Ha hair styling chairs and product shelves',
      },
      
      {
        title: 'Ngân Hà night facade',
        label: 'Facade night',
        body: 'The illuminated sign made the brand stand out at night and easier for guests to remember.',
        image: '/images/history/2018-ngan-ha-facade-night.png',
        alt: 'Beauty Salon Ngan Ha night facade on Ho Hao Hon street',
      },
    ],
  },
  {
    year: '2020',
    eyebrow: 'Growth',
    title: 'The team and the space matured together',
    body: 'The story was no longer only about exterior image. People, service style, and atmosphere became more aligned.',
    meta: ['Team', 'Space', 'Professional'],
    scenes: [
      {
        title: 'The Salon Ngan Ha signboard',
        label: 'Signboard',
        body: 'The storefront sign highlighted hair wash, ear wax, and combo services, making the Nguyen Cu Trinh location easier to recognize.',
        image: '/images/history/2020-ngan-ha-salon-signboard.png',
        alt: 'Salon Ngan Ha storefront signboard on Nguyen Cu Trinh in 2020',
      },
      {
        title: 'The team in blue uniforms',
        label: 'Team blue',
        body: 'This team moment in blue uniforms captures a more unified and professional operating spirit at Ngan Ha.',
        image: '/images/history/2020-ngan-ha-team-blue.png',
        alt: 'Ngan Ha team in blue uniforms in 2020',
      },
      {
        title: 'A brighter guest entrance',
        label: 'Entrance',
        body: 'The interior became more open, with brighter lighting, waiting seats, and a clearer welcome flow.',
        image: '/images/history/2020-ngan-ha-interior-entrance.png',
        alt: 'Ngan Ha guest entrance in 2020',
      },
      {
        title: 'The ao dai team in a Saigon-inspired space',
        label: 'Ao dai team',
        body: 'The colorful ao dai team portrait reflects a period when Ngan Ha refined its brand identity and guest experience.',
        image: '/images/history/2020-ngan-ha-team-ao-dai.png',
        alt: 'Ngan Ha team wearing ao dai in a Saigon-inspired interior in 2020',
      },
    ],
  },
  {
    year: '2021',
    eyebrow: 'Expansion',
    title: 'A new address with a stronger visual identity',
    body: 'The 2021 chapter captures Ngan Ha expanding its service environment and sharpening its identity at the Ngo Duc Ke location.',
    meta: ['Ngo Duc Ke', 'Signboard', 'Service space'],
    scenes: [
      {
        title: 'The gold signboard at 11 Ngo Duc Ke',
        label: 'Gold facade',
        body: 'The large gold sign made the Ngo Duc Ke location more visible from the street while clearly presenting the core services: hair, nail, ear wax, foot, and body.',
        image: '/images/history/2021-ngan-ha-ngo-duc-ke-gold-sign.png',
        alt: 'Beauty Salon Ngan Ha gold signboard at 11 Ngo Duc Ke in 2021',
      },
      
      
      {
        title: 'A warmer and more private therapy room',
        label: 'Therapy room',
        body: 'The treatment beds, softer lighting, and warmer materials show a clearer investment in body-care comfort.',
        image: '/images/history/2021-ngan-ha-treatment-beds.png',
        alt: 'Ngan Ha therapy room with massage beds in 2021',
      },
      {
        title: 'The service floor during operating hours',
        label: 'Guest service',
        body: 'Guests being served on the salon floor show the everyday rhythm of the location: brighter, cleaner, and more welcoming.',
        image: '/images/history/2021-ngan-ha-service-floor-guests.png',
        alt: 'Ngan Ha service floor serving guests in 2021',
      },
      
    ],
  },
  {
    year: '2023',
    eyebrow: 'Branch 2',
    title: 'The Thi Sach branch added a new service rhythm',
    body: 'From the Sauna Salon menu identity to the 6B Thi Sach storefront, the brand entered a clearer expansion stage in location, scale, and service presentation.',
    meta: ['Second branch', 'Thi Sach', 'Sauna Salon'],
    scenes: [
      {
        title: 'The 6B Thi Sach storefront',
        label: 'Thi Sach',
        body: 'The second branch facade shows a stronger presence in the central area, serving guests looking for massage, ear wax, and relaxation care.',
        image: '/images/history/2023-ngan-ha-branch-2-thi-sach-facade.png',
        alt: 'Ngan Ha storefront at 6B Thi Sach',
      },
      {
        title: 'The Thi Sach branch menu identity',
        label: 'Branch menu',
        body: 'The wooden spa menu records how Ngan Ha presented both addresses, with the Thi Sach branch becoming an important expansion point.',
        image: '/images/history/2023-ngan-ha-branch-2-menu-boo.png',
        alt: 'Ngan Ha Sauna Salon wooden menu introducing the Thi Sach branch',
      },
    ],
  },
  {
    year: '2024',
    eyebrow: 'Recognition',
    title: 'New signage, refreshed space, and wider recognition',
    body: 'After updating the signboard and refining the space, Ngan Ha gained stronger visual records from real visits, reviews, and service recommendation channels.',
    meta: ['New signboard', 'Updated space', 'Reviews'],
    scenes: [
      {
        title: 'The updated Ngo Duc Ke signboard',
        label: 'New sign',
        body: 'The refreshed facade made the 11 Ngo Duc Ke address clearer, more modern, and easier to recognize from the street.',
        image: '/images/history/2024-ngan-ha-ngo-duc-ke-new-signboard.png',
        alt: 'Updated Ngan Ha signboard at 11 Ngo Duc Ke',
      },
      {
        title: 'The interior after the space update',
        label: 'Updated space',
        body: 'Service chairs, waiting seats, and lighting were arranged to make the interior feel brighter, cleaner, and more professional.',
        image: '/images/history/2024-ngan-ha-updated-interior-space.png',
        alt: 'Ngan Ha interior after the space update',
      },
      {
        title: 'Featured in a service recommendation list',
        label: 'Media mention',
        body: 'A local recommendation article for safe ear-cleaning addresses in Saigon shows that Ngan Ha gained more online recognition.',
        image: '/images/history/2024-ngan-ha-hcmtoplist-feature.png',
        alt: 'Article featuring Salon Ngan Ha in a Saigon ear-cleaning recommendation list',
        imageFit: 'contain',
        imagePosition: 'center top',
      },
      {
        title: 'A blog mention captured Salon Ngan Ha',
        label: 'Blog mention',
        body: 'The blog screenshot shows the Beauty Salon Ngan Ha facade with a written guest note, making the online recognition moment clearer.',
        image: '/images/history/2024-ngan-ha-naver-recognition-blog.png',
        alt: 'Blog screenshot recognizing Beauty Salon Ngan Ha',
      },
      {
        title: 'A review told the visit story in Ho Chi Minh City',
        label: 'Travel blog',
        body: 'The review mentioned massage service in Ho Chi Minh City and the location of Ngan Ha, adding evidence from real guest experience.',
        image: '/images/history/2024-ngan-ha-naver-review-street.png',
        alt: 'International review screenshot about Ngan Ha massage service in Ho Chi Minh City',
      },
    ],
  },
  {
    year: '2026',
    eyebrow: 'Brand Sync',
    title: 'Oria brand alignment and the FnB expansion',
    body: 'In 2026, the identity became clearer: Oria Spa aligned under the TechGalaxy Group ecosystem while OriaFarm Store opened a new FnB branch.',
    meta: ['Oria Spa', 'OriaFarm Store', 'FnB'],
    scenes: [
      {
        title: 'Oria Spa by TechGalaxy Group signboard',
        label: 'Brand sync',
        body: 'The Oria Spa signboard at 11 Ngo Duc Ke marks a clearer brand alignment, keeping the care-led spirit while bringing the Oria name forward.',
        image: '/images/history/2026-oria-spa-tech-galaxy-sign.png',
        alt: 'Oria Spa by TechGalaxy Group signboard at 11 Ngo Duc Ke in 2026',
      },
      {
        title: 'OriaFarm Store expands into FnB',
        label: 'FnB storefront',
        body: 'The OriaFarm Store frontage introduces a new experience branch in the Oria ecosystem: drinks, fruit, and fresh products for everyday guests.',
        image: '/images/history/2026-oriafarm-storefront.png',
        alt: 'OriaFarm Store storefront in 2026',
        imagePosition: 'center top',
      },
      {
        title: 'Fresh fruit and drinks at OriaFarm Store',
        label: 'Fresh bar',
        body: 'The fruit display, vegetables, and Rainbow Cup line show a fresher, brighter FnB direction within the expanding brand journey.',
        image: '/images/history/2026-oriafarm-fnb-display.png',
        alt: 'Fruit and drinks display at OriaFarm Store in 2026',
      },
    ],
  },
];

export const normalizeHistoryLocale = (locale: string): HistoryLocale => {
  if (locale === 'zh') return 'cn';
  return HISTORY_LOCALES.includes(locale as HistoryLocale) ? locale as HistoryLocale : 'vi';
};

type LocalizedText = Record<HistoryLocale, string>;
type LocalizedMeta = Record<HistoryLocale, string[]>;

const historyText = (vi: string, en: string, values?: Partial<Record<'jp' | 'kr' | 'cn', string>>): LocalizedText => ({
  vi,
  en,
  jp: values?.jp || en,
  kr: values?.kr || en,
  cn: values?.cn || en,
});

const historyMeta = (vi: string[], en: string[], values?: Partial<Record<'jp' | 'kr' | 'cn', string[]>>): LocalizedMeta => ({
  vi,
  en,
  jp: values?.jp || en,
  kr: values?.kr || en,
  cn: values?.cn || en,
});

const mergeLocalizedText = (defaults: LocalizedText, value?: Record<string, string>) => ({ ...defaults, ...(value || {}) });
const mergeLocalizedMeta = (defaults: LocalizedMeta, value?: Record<string, string[]>) => ({ ...defaults, ...(value || {}) });

export const createDefaultBrandHistoryConfig = () => ({
  hero: {
    image: '/images/about-bg.png',
    eyebrow: historyText(HISTORY_HERO_DEFAULTS.vi.eyebrow, HISTORY_HERO_DEFAULTS.en.eyebrow, {
      jp: HISTORY_HERO_DEFAULTS.jp.eyebrow, kr: HISTORY_HERO_DEFAULTS.kr.eyebrow, cn: HISTORY_HERO_DEFAULTS.cn.eyebrow,
    }),
    title1: historyText(HISTORY_HERO_DEFAULTS.vi.title1, HISTORY_HERO_DEFAULTS.en.title1, {
      jp: HISTORY_HERO_DEFAULTS.jp.title1, kr: HISTORY_HERO_DEFAULTS.kr.title1, cn: HISTORY_HERO_DEFAULTS.cn.title1,
    }),
    title2: historyText(HISTORY_HERO_DEFAULTS.vi.title2, HISTORY_HERO_DEFAULTS.en.title2, {
      jp: HISTORY_HERO_DEFAULTS.jp.title2, kr: HISTORY_HERO_DEFAULTS.kr.title2, cn: HISTORY_HERO_DEFAULTS.cn.title2,
    }),
    body: historyText(HISTORY_HERO_DEFAULTS.vi.body, HISTORY_HERO_DEFAULTS.en.body, {
      jp: HISTORY_HERO_DEFAULTS.jp.body, kr: HISTORY_HERO_DEFAULTS.kr.body, cn: HISTORY_HERO_DEFAULTS.cn.body,
    }),
  },
  finale: {
    eyebrow: historyText(HISTORY_FINALE_DEFAULTS.vi.eyebrow, HISTORY_FINALE_DEFAULTS.en.eyebrow, {
      jp: HISTORY_FINALE_DEFAULTS.jp.eyebrow, kr: HISTORY_FINALE_DEFAULTS.kr.eyebrow, cn: HISTORY_FINALE_DEFAULTS.cn.eyebrow,
    }),
    title: historyText(HISTORY_FINALE_DEFAULTS.vi.title, HISTORY_FINALE_DEFAULTS.en.title, {
      jp: HISTORY_FINALE_DEFAULTS.jp.title, kr: HISTORY_FINALE_DEFAULTS.kr.title, cn: HISTORY_FINALE_DEFAULTS.cn.title,
    }),
    body: historyText(HISTORY_FINALE_DEFAULTS.vi.body, HISTORY_FINALE_DEFAULTS.en.body, {
      jp: HISTORY_FINALE_DEFAULTS.jp.body, kr: HISTORY_FINALE_DEFAULTS.kr.body, cn: HISTORY_FINALE_DEFAULTS.cn.body,
    }),
  },
  chapters: chaptersVi.map((chapterVi, chapterIndex) => {
    const chapterEn = chaptersEn[chapterIndex] || chapterVi;
    const translations = {
      jp: HISTORY_CHAPTER_TRANSLATIONS.jp[chapterIndex],
      kr: HISTORY_CHAPTER_TRANSLATIONS.kr[chapterIndex],
      cn: HISTORY_CHAPTER_TRANSLATIONS.cn[chapterIndex],
    };

    return {
      id: `history-${chapterVi.year}`,
      year: chapterVi.year,
      eyebrow: historyText(chapterVi.eyebrow, chapterEn.eyebrow, {
        jp: translations.jp?.eyebrow, kr: translations.kr?.eyebrow, cn: translations.cn?.eyebrow,
      }),
      title: historyText(chapterVi.title, chapterEn.title, {
        jp: translations.jp?.title, kr: translations.kr?.title, cn: translations.cn?.title,
      }),
      body: historyText(chapterVi.body, chapterEn.body, {
        jp: translations.jp?.body, kr: translations.kr?.body, cn: translations.cn?.body,
      }),
      meta: historyMeta(chapterVi.meta, chapterEn.meta, {
        jp: translations.jp?.meta, kr: translations.kr?.meta, cn: translations.cn?.meta,
      }),
      scenes: chapterVi.scenes.map((sceneVi, sceneIndex) => {
        const sceneEn = chapterEn.scenes[sceneIndex] || sceneVi;
        const sceneTranslations = {
          jp: translations.jp?.scenes[sceneIndex],
          kr: translations.kr?.scenes[sceneIndex],
          cn: translations.cn?.scenes[sceneIndex],
        };

        return {
          id: `history-${chapterVi.year}-${sceneIndex + 1}`,
          title: historyText(sceneVi.title, sceneEn.title, {
            jp: sceneTranslations.jp?.title, kr: sceneTranslations.kr?.title, cn: sceneTranslations.cn?.title,
          }),
          label: historyText(sceneVi.label, sceneEn.label, {
            jp: sceneTranslations.jp?.label, kr: sceneTranslations.kr?.label, cn: sceneTranslations.cn?.label,
          }),
          body: historyText(sceneVi.body, sceneEn.body, {
            jp: sceneTranslations.jp?.body, kr: sceneTranslations.kr?.body, cn: sceneTranslations.cn?.body,
          }),
          image: sceneVi.image,
          alt: historyText(sceneVi.alt, sceneEn.alt, {
            jp: sceneTranslations.jp?.title, kr: sceneTranslations.kr?.title, cn: sceneTranslations.cn?.title,
          }),
          imageFit: sceneVi.imageFit,
          imagePosition: sceneVi.imagePosition,
        };
      }),
    };
  }),
});

export const hydrateBrandHistoryConfig = (config?: any) => {
  const defaults = createDefaultBrandHistoryConfig();
  const source = Array.isArray(config) ? { chapters: config } : config || {};
  const sourceChapters = Array.isArray(source.chapters) ? source.chapters : [];
  const chaptersByYear = new Map(sourceChapters.map((chapter: any) => [chapter.year, chapter]));
  const extraChapters = sourceChapters
    .filter((chapter: any) => !defaults.chapters.some(defaultChapter => defaultChapter.year === chapter.year))
    .map((chapter: any) => ({
      ...chapter,
      id: chapter.id || `history-${chapter.year}`,
      eyebrow: mergeLocalizedText(historyText(chapter.eyebrow?.vi || '', chapter.eyebrow?.en || ''), chapter.eyebrow),
      title: mergeLocalizedText(historyText(chapter.title?.vi || '', chapter.title?.en || ''), chapter.title),
      body: mergeLocalizedText(historyText(chapter.body?.vi || '', chapter.body?.en || ''), chapter.body),
      meta: mergeLocalizedMeta(historyMeta(chapter.meta?.vi || [], chapter.meta?.en || []), chapter.meta),
      scenes: (chapter.scenes || []).map((scene: any, sceneIndex: number) => ({
        ...scene,
        id: scene.id || `history-${chapter.year}-${sceneIndex + 1}`,
        title: mergeLocalizedText(historyText(scene.title?.vi || '', scene.title?.en || ''), scene.title),
        label: mergeLocalizedText(historyText(scene.label?.vi || '', scene.label?.en || ''), scene.label),
        body: mergeLocalizedText(historyText(scene.body?.vi || '', scene.body?.en || ''), scene.body),
        alt: mergeLocalizedText(historyText(scene.alt?.vi || '', scene.alt?.en || ''), scene.alt),
      })),
    }));

  return {
    hero: {
      ...defaults.hero,
      ...(source.hero || {}),
      image: source.hero?.image || defaults.hero.image,
      eyebrow: mergeLocalizedText(defaults.hero.eyebrow, source.hero?.eyebrow),
      title1: mergeLocalizedText(defaults.hero.title1, source.hero?.title1),
      title2: mergeLocalizedText(defaults.hero.title2, source.hero?.title2),
      body: mergeLocalizedText(defaults.hero.body, source.hero?.body),
    },
    finale: {
      ...defaults.finale,
      ...(source.finale || {}),
      eyebrow: mergeLocalizedText(defaults.finale.eyebrow, source.finale?.eyebrow),
      title: mergeLocalizedText(defaults.finale.title, source.finale?.title),
      body: mergeLocalizedText(defaults.finale.body, source.finale?.body),
    },
    chapters: [...defaults.chapters.map(defaultChapter => {
      const chapter: any = chaptersByYear.get(defaultChapter.year) || {};
      return {
        ...defaultChapter,
        ...chapter,
        id: chapter.id || defaultChapter.id,
        eyebrow: mergeLocalizedText(defaultChapter.eyebrow, chapter.eyebrow),
        title: mergeLocalizedText(defaultChapter.title, chapter.title),
        body: mergeLocalizedText(defaultChapter.body, chapter.body),
        meta: mergeLocalizedMeta(defaultChapter.meta, chapter.meta),
        scenes: defaultChapter.scenes.map((defaultScene, sceneIndex) => {
          const scene: any = chapter.scenes?.[sceneIndex] || {};
          return {
            ...defaultScene,
            ...scene,
            id: scene.id || defaultScene.id,
            title: mergeLocalizedText(defaultScene.title, scene.title),
            label: mergeLocalizedText(defaultScene.label, scene.label),
            body: mergeLocalizedText(defaultScene.body, scene.body),
            alt: mergeLocalizedText(defaultScene.alt, scene.alt),
          };
        }),
      };
    }), ...extraChapters],
  };
};

export const History = () => {
  const { currentLang } = useTranslation();
  const locale = normalizeHistoryLocale(currentLang);
  const copy = HISTORY_INTERFACE_COPY[locale];
  const { brandHistory, getLocalizedText } = useSystemSettings();
  const hydratedHistory = useMemo(() => hydrateBrandHistoryConfig(brandHistory), [brandHistory]);

  const chapters = useMemo(() => {
    if (hydratedHistory.chapters.length > 0) {
      return hydratedHistory.chapters.map((chapter: any) => ({
        year: chapter.year || '',
        eyebrow: getLocalizedText(chapter.eyebrow, locale, ''),
        title: getLocalizedText(chapter.title, locale, ''),
        body: getLocalizedText(chapter.body, locale, ''),
        meta: chapter.meta?.[locale] || [],
        scenes: chapter.scenes?.map((scene: any) => ({
          title: getLocalizedText(scene.title, locale, ''),
          label: getLocalizedText(scene.label, locale, ''),
          body: getLocalizedText(scene.body, locale, ''),
          image: scene.image || '',
          alt: getLocalizedText(scene.alt, locale, getLocalizedText(scene.title, locale, '')),
          imageFit: scene.imageFit,
          imagePosition: scene.imagePosition,
        })) || []
      }));
    }
    return chaptersVi;
  }, [hydratedHistory, locale, getLocalizedText]);
  const [activeChapter, setActiveChapter] = useState(0);
  const [activeScenes, setActiveScenes] = useState<Record<string, number>>({});
  const [cacheBuster, setCacheBuster] = useState('');
  
  useEffect(() => {
    setCacheBuster(`v=${Date.now()}`);
  }, []);

  const getBustedUrl = useCallback((url: string) => {
    if (!url) return '';
    if (!cacheBuster) return url;
    return url.includes('?') ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`;
  }, [cacheBuster]);

  const shellRef = useRef<HTMLElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [isNavVisible, setIsNavVisible] = useState(false);
  const timersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const timelineProgress = useMotionValue(0);
  const smoothTimelineProgress = useSpring(timelineProgress, {
    stiffness: 34,
    damping: 30,
    mass: 1.05,
    restDelta: 0.0008,
  });

  const restartSceneTimer = useCallback((chapter: Chapter) => {
    if (timersRef.current[chapter.year]) {
      clearInterval(timersRef.current[chapter.year]);
      delete timersRef.current[chapter.year];
    }

    if (chapter.scenes.length < 2) return;

    timersRef.current[chapter.year] = setInterval(() => {
      setActiveScenes(prev => ({
        ...prev,
        [chapter.year]: ((prev[chapter.year] || 0) + 1) % chapter.scenes.length,
      }));
    }, 3600);
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-history-chapter]'));
    let frame = 0;

    const updateActiveChapter = () => {
      frame = 0;
      const viewportAnchor = window.innerHeight * 0.52;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      nodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect();
        const chapterCenter = rect.top + rect.height * 0.48;
        const distance = Math.abs(chapterCenter - viewportAnchor);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      setActiveChapter(prev => (prev === nearestIndex ? prev : nearestIndex));

      if (timelineRef.current) {
        const tRect = timelineRef.current.getBoundingClientRect();
        // Visible when the timeline enters the viewport, leaving a bit of margin
        setIsNavVisible(tRect.top < window.innerHeight * 0.8 && tRect.bottom > window.innerHeight * 0.2);
      }
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveChapter);
    };

    updateActiveChapter();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, [chapters]);

  useEffect(() => {
    Object.values(timersRef.current).forEach(clearInterval);
    timersRef.current = {};

    chapters.forEach(restartSceneTimer);

    return () => {
      Object.values(timersRef.current).forEach(clearInterval);
      timersRef.current = {};
    };
  }, [chapters, restartSceneTimer]);

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const mx = ((event.clientX - rect.left) / rect.width) * 100;
    const my = ((event.clientY - rect.top) / rect.height) * 100;
    event.currentTarget.style.setProperty('--mx', `${mx}%`);
    event.currentTarget.style.setProperty('--my', `${my}%`);
  };

  const jumpToChapter = (index: number) => {
    document.getElementById(`history-${chapters[index].year}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  const selectScene = (chapter: Chapter, index: number) => {
    setActiveScenes(prev => ({
      ...prev,
      [chapter.year]: index,
    }));
    restartSceneTimer(chapter);
  };

  const cycleScene = (chapter: Chapter, currentIndex: number, direction: -1 | 1) => {
    const nextIndex = (currentIndex + direction + chapter.scenes.length) % chapter.scenes.length;
    selectScene(chapter, nextIndex);
  };

  const handleSceneKey = (event: KeyboardEvent<HTMLElement>, chapter: Chapter, index: number) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    selectScene(chapter, index);
  };

  const handleStageKey = (event: KeyboardEvent<HTMLDivElement>, chapter: Chapter, currentIndex: number) => {
    if (chapter.scenes.length < 2 || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    cycleScene(chapter, currentIndex, 1);
  };

  const handleYearKey = (event: KeyboardEvent<HTMLElement>, index: number) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    jumpToChapter(index);
  };

  const progress = chapters.length <= 1 ? 100 : (activeChapter / (chapters.length - 1)) * 100;
  const activeYear = chapters[activeChapter]?.year || chapters[0].year;

  useEffect(() => {
    timelineProgress.set(progress / 100);
  }, [progress, timelineProgress]);

  return (
    <section
      ref={shellRef}
      id="history"
      className={styles.history}
      onPointerMove={handlePointerMove}
      style={{ '--mx': '52%', '--my': '24%' } as CSSProperties}
    >
      <div className={styles.texture} aria-hidden="true" />
      <div className={styles.ambientA} aria-hidden="true" />
      <div className={styles.ambientB} aria-hidden="true" />

      <motion.header
        className={styles.hero}
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{ duration: 0.9, ease: [0.22, 0.8, 0.22, 1] }}
      >
        <div className={styles.heroMedia}>
          <Image
            src={getBustedUrl(hydratedHistory.hero?.image || "/images/about-bg.png")}
            alt={getLocalizedText(hydratedHistory.hero?.title2, locale, 'Oria Spa')}
            fill
            unoptimized
            priority
            sizes="100vw"
          />
        </div>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>
            {getLocalizedText(hydratedHistory.hero?.eyebrow, locale, HISTORY_HERO_DEFAULTS[locale].eyebrow)}
          </span>
          <h1>
            {getLocalizedText(hydratedHistory.hero?.title1, locale, HISTORY_HERO_DEFAULTS[locale].title1)} <em>{getLocalizedText(hydratedHistory.hero?.title2, locale, HISTORY_HERO_DEFAULTS[locale].title2)}</em>
          </h1>
          <p>
            {getLocalizedText(hydratedHistory.hero?.body, locale, HISTORY_HERO_DEFAULTS[locale].body)}
          </p>
          <a className={styles.scrollCue} href="#history-2015">
            <span />
            {copy.scrollCue}
          </a>
        </div>
      </motion.header>

      <div className={styles.intro}>
        <div>
          <span className={styles.eyebrow}>{copy.introEyebrow}</span>
          <h2>{copy.introTitle}</h2>
          <p>{copy.introBody}</p>
        </div>
        <div className={styles.stickyYear}>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={activeYear}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeYear}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className={styles.timeline} ref={timelineRef}>
        <div className={styles.timeRibbon} aria-hidden="true" />
        <motion.div className={styles.flow} style={{ scaleY: smoothTimelineProgress }} aria-hidden="true" />

        {chapters.map((chapter: Chapter, chapterIndex: number) => {
          const sceneIndex = activeScenes[chapter.year] || 0;
          const scene = chapter.scenes[sceneIndex];
          const isActive = chapterIndex === activeChapter;

          return (
            <article
              key={chapter.year}
              id={`history-${chapter.year}`}
              data-history-chapter
              data-history-index={chapterIndex}
              className={`${styles.chapter} ${isActive ? styles.chapterActive : ''}`}
            >
              <motion.div
                className={styles.copy}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.34 }}
                transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className={styles.eyebrow}>{chapter.eyebrow}</span>
                <div className={styles.yearLarge}>{chapter.year}</div>
                <h3>{chapter.title}</h3>
                <p>{chapter.body}</p>
                <div className={styles.meta}>
                  {chapter.meta.map((item: string, index: number) => (
                    <span key={index}>{item}</span>
                  ))}
                </div>
                <div className={styles.storyInline}>
                  <span>{copy.currentMoment}</span>
                  <strong>{scene.title}</strong>
                  <p>{scene.body}</p>
                </div>
              </motion.div>

              <motion.div
                className={`${styles.stage} ${chapter.scenes.length === 1 ? styles.singleStage : ''}`}
                initial={{ opacity: 0, scale: 0.985 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ amount: 0.3 }}
                transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className={styles.stageMain}
                  role={chapter.scenes.length > 1 ? 'group' : undefined}
                  tabIndex={chapter.scenes.length > 1 ? 0 : undefined}
                  aria-label={
                    chapter.scenes.length > 1
                      ? `${copy.imageSequence} ${chapter.year}. ${copy.imageSequenceHint}`
                      : undefined
                  }
                  onClick={() => {
                    if (chapter.scenes.length > 1) cycleScene(chapter, sceneIndex, 1);
                  }}
                  onKeyDown={event => handleStageKey(event, chapter, sceneIndex)}
                >
                  {chapter.scenes.map((item: any, index: number) => (
                    <div key={item.title} className={`${styles.slide} ${index === sceneIndex ? styles.slideActive : ''}`}>
                      <Image
                        src={getBustedUrl(item.image)}
                        alt={item.alt}
                        fill
                        unoptimized
                        sizes="(max-width: 760px) 85vw, 44vw"
                        style={{
                          objectFit: item.imageFit,
                          objectPosition: item.imagePosition,
                        }}
                      />
                    </div>
                  ))}
                  <div className={styles.stageHead}>
                    <span>{chapter.year} · {chapter.eyebrow}</span>
                    <span>
                      {String(sceneIndex + 1).padStart(2, '0')} / {String(chapter.scenes.length).padStart(2, '0')}
                    </span>
                  </div>
                  <div className={styles.stageCopy}>
                    <h4>{scene.title}</h4>
                    <p>{scene.body}</p>
                  </div>
                  {chapter.scenes.length > 1 && (
                    <div className={styles.stageArrows} aria-label={copy.changeImage}>
                      <span
                        role="link"
                        tabIndex={0}
                        className={styles.stageArrow}
                        aria-label={copy.previousImage}
                        onClick={event => {
                          event.stopPropagation();
                          cycleScene(chapter, sceneIndex, -1);
                        }}
                        onKeyDown={event => {
                          if (event.key !== 'Enter' && event.key !== ' ') return;
                          event.preventDefault();
                          event.stopPropagation();
                          cycleScene(chapter, sceneIndex, -1);
                        }}
                      >
                        ‹
                      </span>
                      <span
                        role="link"
                        tabIndex={0}
                        className={styles.stageArrow}
                        aria-label={copy.nextImage}
                        onClick={event => {
                          event.stopPropagation();
                          cycleScene(chapter, sceneIndex, 1);
                        }}
                        onKeyDown={event => {
                          if (event.key !== 'Enter' && event.key !== ' ') return;
                          event.preventDefault();
                          event.stopPropagation();
                          cycleScene(chapter, sceneIndex, 1);
                        }}
                      >
                        ›
                      </span>
                    </div>
                  )}
                </div>

                {chapter.scenes.length > 1 && (
                  <div className={styles.filmstrip} role="tablist" aria-label={copy.sceneMoments}>
                    {chapter.scenes.map((item: any, index: number) => (
                      <span
                        key={item.title}
                        role="tab"
                        tabIndex={0}
                        className={index === sceneIndex ? styles.sceneActive : styles.scene}
                        onClick={() => selectScene(chapter, index)}
                        onKeyDown={event => handleSceneKey(event, chapter, index)}
                        aria-selected={index === sceneIndex}
                        aria-label={`${copy.viewImage} ${index + 1}: ${item.label}`}
                      >
                        <span className={styles.sceneThumb}>
                          <Image src={getBustedUrl(item.image)} alt="" fill sizes="96px" unoptimized />
                        </span>
                        <span className={styles.sceneText}>
                          <small>{String(index + 1).padStart(2, '0')}</small>
                          <span>{item.label}</span>
                        </span>
                        <i />
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>

              <div className={styles.yearFloat} aria-hidden="true">
                {chapter.year}
              </div>
            </article>
          );
        })}
      </div>

      <nav 
        className={styles.yearNav} 
        aria-label={copy.historyYears}
        style={{ 
          opacity: isNavVisible ? 1 : 0, 
          visibility: isNavVisible ? 'visible' : 'hidden',
          transition: 'opacity 0.6s ease, visibility 0.6s ease' 
        }}
      >
        {chapters.map((chapter, index) => (
          <span
            key={chapter.year}
            role="link"
            tabIndex={0}
            className={index === activeChapter ? styles.yearButtonActive : styles.yearButton}
            onClick={() => jumpToChapter(index)}
            onKeyDown={event => handleYearKey(event, index)}
          >
            {chapter.year}
          </span>
        ))}
      </nav>

    </section>
  );
};

export default History;
