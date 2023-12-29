import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://pengyuwa.ng/", // replace this with your deployed domain
  author: "Pengyu Wang",
  desc: "Pengyu Wang's personal blog",
  title: "Pengyu Wang",
  ogImage: "",
  lightAndDarkMode: true,
  postPerPage: 5,
};

export const LOCALE = {
  lang: "en", // html lang code. Set this empty and default will be "en"
  langTag: ["en-EN"], // BCP 47 Language Tags. Set this empty [] to use the environment default
} as const;

export const LOGO_IMAGE = {
  enable: false,
  svg: false,
  width: 256,
  height: 256,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/cswpy",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/pengyu-wang/",
    linkTitle: `${SITE.title} on LinkedIn`,
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:hncswpy@gmail.com",
    linkTitle: `Send an email to ${SITE.title}`,
    active: true,
  },
  {
    name: "Unsplash",
    href: "https://unsplash.com/@hncswpy",
    linkTitle: `View ${SITE.title}'s photography on Unsplash`,
    active: true,
  },
  {
    name: "Google Scholar",
    href: "https://google.com",
    linkTitle: `${SITE.title} on Google Scholar`,
    active: true,
  },
];
