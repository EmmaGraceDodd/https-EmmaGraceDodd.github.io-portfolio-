// All portfolio copy and media live here. Edit text in this file and the
// site updates everywhere (home cards + case study pages).

export const media = (file: string) => `${import.meta.env.BASE_URL}media/${file}`

export type MediaItem = {
  src: string
  alt: string
  /** Set for videos. `autoplay` = muted loop (no sound), otherwise click to play. */
  video?: "autoplay" | "controls"
  poster?: string
}

export type GalleryItem = MediaItem & {
  caption: string
  /** wide = full row, left/right = staggered, tall = narrow centered (vertical video),
   *  scroll = long webpage screenshot that scrolls inside a browser frame */
  layout: "wide" | "left" | "right" | "tall" | "scroll"
  /** Two or three pieces shown side by side in one row */
  group?: MediaItem[]
  /** Shape for grouped pieces, e.g. "4 / 5". "auto" keeps each image's natural shape. */
  ratio?: string
}

export type Project = {
  slug: string
  number: string
  title: string
  shortTitle: string
  category: string
  year: string
  summary: string
  challengeTitle: string
  challenge: string
  approachTitle: string
  approach: string
  outcome: string
  role: string
  channels: string
  note?: string
  cover: MediaItem
  hero: MediaItem[]
  className: string
  /** false = shown in the smaller "More things I've made" section */
  featured: boolean
  metrics?: Array<{ value: string; label: string }>
  palette?: Array<{ hex: string; name: string; dark?: boolean }>
  marks?: MediaItem[]
  gallery: GalleryItem[]
}

export const projects: Project[] = [
  {
    slug: "commercial-lending",
    number: "01",
    title: "Commercial Lending\nCampaign",
    shortTitle: "Commercial Lending Campaign",
    category: "A personal campaign for big business goals",
    year: "2026",
    summary:
      "I wanted this lending campaign to feel like a personal introduction, starting with a box worth opening.",
    challengeTitle: "Getting noticed by the people who refer.",
    challenge:
      "Our commercial lenders wanted more referrals from CPAs, the people business owners trust when a financing question comes up. CPAs already get plenty of bank mail. I needed something personal enough to get opened and clear enough that they’d remember exactly who to call.",
    approachTitle: "Built around each lender.",
    approach:
      "I researched and refined the prospect lists, then built the campaign around each lender. Every package had a custom box, an organizer engraved with the recipient’s name, a brochure, and a special-offer postcard. QR codes led to lender-specific landing pages, and a Constant Contact email followed up. I timed it all for right after tax season, when CPAs finally have a minute to breathe.",
    outcome:
      "The campaign contributed to approximately $2.3 million in funded commercial loans on a total cost of about $9,730. Seeing an idea I took from a first sketch all the way to the mailbox play a part in that was a big moment for me.",
    role: "Research, concept, copy, design, production, and landing pages",
    channels: "Custom mailers, print, email, and landing pages",
    cover: { src: media("cl-box.webp"), alt: "Open Florida Capital Bank mailer box with a QR code inside" },
    hero: [{ src: media("cl-box.webp"), alt: "Open Florida Capital Bank mailer box with a QR code inside" }],
    featured: true,
    className: "project-card--pink",
    metrics: [
      { value: "$2.3M", label: "Contributed to funded commercial loans" },
      { value: "$9.7K", label: "Total campaign cost" },
      { value: "5", label: "Lenders, each with their own materials" },
    ],
    gallery: [
      {
        layout: "wide",
        src: media("cl-spreads.webp"),
        alt: "Florida Capital Bank CPA brochure spreads",
        caption: "A brochure made for each lender",
      },
      {
        layout: "left",
        src: media("cl-package-photo.webp"),
        alt: "Finished mailer box, engraved organizer, and brochure on a desk",
        caption: "The real thing, from my desk to the mailroom",
        group: [
          { src: media("cl-package-photo.webp"), alt: "Finished mailer box, engraved organizer, and brochure on a desk" },
          { src: media("cl-mailing-day.webp"), alt: "Stack of packed mailer boxes on a cart, addresses hidden" },
        ],
      },
      {
        layout: "right",
        src: media("cl-postcard.webp"),
        alt: "Front and back of the special-offer postcard with a QR code",
        caption: "A special-offer postcard to keep the conversation going",
      },
    ],
  },
  {
    slug: "roundbird-coffee",
    number: "02",
    title: "Roundbird\nCoffee",
    shortTitle: "Roundbird Coffee",
    category: "A passion project for a Jacksonville favorite",
    year: "2026",
    summary:
      "Roundbird was a little coffee shop here in Jacksonville that sadly closed its doors, but I always felt like the brand had so much personality and potential.",
    challengeTitle: "Why Roundbird?",
    challenge:
      "I wanted to have some fun imagining what a new chapter could look like while keeping the charm that made it special in the first place.",
    approachTitle: "How I played with it.",
    approach:
      "I played around with bold colors, quirky illustrations, nostalgic photography, and a little bit of everything I love about design. I wanted Roundbird to feel like the kind of place you stop in for a quick coffee and somehow end up staying for hours.",
    outcome: "Coffee by day, wine by night, and one little bird on everything.",
    role: "Logo, illustration, pattern, photography, and social",
    channels: "Brand identity, packaging, merch, and social",
    note: "Personal concept project. Not affiliated with the original Roundbird.",
    cover: { src: media("rb-closeup.webp"), alt: "Hands holding a coffee cup with the Roundbird bird mark" },
    hero: [{ src: media("rb-closeup.webp"), alt: "Hands holding a coffee cup with the Roundbird bird mark" }],
    featured: true,
    className: "project-card--roundbird",
    palette: [
      { hex: "#EC1B24", name: "Cherry red", dark: true },
      { hex: "#E0A154", name: "Honey latte" },
      { hex: "#D1CBC2", name: "Oat milk" },
      { hex: "#3C3B34", name: "Espresso", dark: true },
    ],
    marks: [
      { src: media("rb-logo.webp"), alt: "Roundbird wordmark" },
      { src: media("rb-mark.webp"), alt: "Roundbird bird mark" },
      { src: media("rb-logo-lower.webp"), alt: "Lowercase round bird wordmark" },
    ],
    gallery: [
      {
        layout: "left",
        src: media("rb-cup.webp"),
        alt: "Espresso pouring into a Roundbird cup",
        caption: "The first pour",
      },
      {
        layout: "wide",
        src: media("rb-kit-1.webp"),
        alt: "Roundbird brand kit pages",
        caption: "The brand kit: coffee by day, wine by night",
        ratio: "3 / 4",
        group: [
          { src: media("rb-kit-1.webp"), alt: "Roundbird brand kit with logo, colors, and photography" },
          { src: media("rb-kit-2.webp"), alt: "Coffee and wine brand kit page: a full circle moment" },
        ],
      },
      {
        layout: "wide",
        src: media("rb-shop.webp"),
        alt: "Roundbird on a shop window, a hat, and a wine glass",
        caption: "On the window, on a hat, on a wine glass",
        group: [
          { src: media("rb-shop.webp"), alt: "Roundbird lettering on a storefront window" },
          { src: media("rb-hat.webp"), alt: "Black Roundbird hat with the bird mark" },
          { src: media("rb-wine.webp"), alt: "Wine glasses etched with the Roundbird mark" },
        ],
      },
      {
        layout: "wide",
        src: media("rb-social-1.webp"),
        alt: "Roundbird social posts",
        caption: "Social posts that feel like your favorite spot",
        group: [
          { src: media("rb-social-1.webp"), alt: "Roundbird social post with a coffee sleeve and meetup invite" },
          { src: media("rb-social-2.webp"), alt: "Roundbird social post: what if it all works out" },
        ],
      },
      {
        layout: "wide",
        src: media("rb-pattern.webp"),
        alt: "Roundbird illustrated pattern of coffee cups, wine glasses, and music notes",
        caption: "The pattern: coffee, wine, and a little music",
      },
      {
        layout: "left",
        src: media("rb-coffee-date.mp4"),
        video: "autoplay",
        poster: media("rb-coffee-date-poster.webp"),
        alt: "Short video of a Roundbird iced coffee being photographed",
        caption: "Coffee date",
        group: [
          {
            src: media("rb-coffee-date.mp4"),
            video: "autoplay",
            poster: media("rb-coffee-date-poster.webp"),
            alt: "Short video of a Roundbird iced coffee being photographed",
          },
          { src: media("rb-illustrations.webp"), alt: "Hand-drawn Roundbird illustrations" },
        ],
      },
    ],
  },
  {
    slug: "fee-advantage-review",
    number: "03",
    title: "Treasury Management\nCampaign",
    shortTitle: "Treasury Management Campaign",
    category: "A playful campaign about not-so-fun fees",
    year: "2026",
    summary: "A spreadsheet gave me the idea. The challenge was making people care about what was in it.",
    challengeTitle: "Making bank fees worth a second look.",
    challenge:
      "While comparing our Treasury Management pricing with competitors, I noticed we came out ahead on a lot of fees. I pitched a free Fee Advantage Review to leadership, and the retail team picked dental practices as the first audience. The catch: nobody gets excited about bank fees, and the message still had to feel credible coming from a bank.",
    approachTitle: "One idea, three executions.",
    approach:
      "I built one idea and gave it three executions. For dental practices, a tooth-shaped mailer said “Let’s get to the root of your banking fees.” On social, a leaky piggy bank asked “Is your money leaking?” In Gainesville, ads in the Gainesville Sun and The Independent Florida Alligator showed fees hiding just below the surface, complete with one very cute alligator. Every piece pointed to landing pages I built for each market manager, with forms, QR codes, and call tracking. I created all of the campaign creative. An outside partner uploaded my ads and set up the Meta and LinkedIn campaigns.",
    outcome:
      "From July through late October 2026, the Meta and LinkedIn ads earned more than 1.5 million impressions and sent over 6,100 visits to the landing pages, at about 86 cents a visit. The LinkedIn ads averaged a 2.36% click-through rate. These are awareness and traffic results, not leads. Next, I want to tighten conversion tracking so we can see which of those visits turn into fee reviews.",
    role: "Research, the big idea, copy, art direction, and design",
    channels: "Direct mail, Meta and LinkedIn ads, local print, and landing pages",
    cover: { src: media("tm-social.webp"), alt: "Grid of Fee Advantage Review social ads" },
    hero: [{ src: media("tm-social.webp"), alt: "Grid of Fee Advantage Review social ads" }],
    featured: true,
    className: "project-card--blue",
    metrics: [
      { value: "1.58M", label: "Meta and LinkedIn ad impressions" },
      { value: "6,100+", label: "Visits to the landing pages" },
      { value: "2.36%", label: "LinkedIn click-through rate" },
    ],
    gallery: [
      {
        layout: "wide",
        src: media("tm-tooth.webp"),
        alt: "Front and back of a tooth-shaped banking fee mailer",
        caption: "Execution 1 · Direct mail: yes, the mailer is tooth-shaped",
      },
      {
        layout: "left",
        src: media("tm-social-alt.webp"),
        alt: "Four social ads: $2,999+ a year, It takes 5 minutes, money leaking bucket, Are you overpaying",
        caption: "Execution 2 · Social: four ways into one message",
      },
      {
        layout: "right",
        src: media("tm-landing.webp"),
        alt: "Is your money leaking landing page on laptop and phone",
        caption: "Every execution pointed here: the Fee Advantage Review page",
      },
      {
        layout: "left",
        src: media("tm-sun-print.webp"),
        alt: "Gainesville Sun print ad with a leaking piggy bank",
        caption: "Execution 3 · Gainesville Sun: the leaky piggy bank",
      },
      {
        layout: "right",
        src: media("tm-gator-print.webp"),
        alt: "Independent Florida Alligator print ad with an alligator peeking above the water",
        caption: "Execution 3 · The Alligator: fees hiding below the surface",
      },
      {
        layout: "wide",
        src: media("tm-gator-landing.webp"),
        alt: "Alligator-themed fee review landing page on laptop and phone",
        caption: "Execution 3 · And the gator followed them online",
      },
    ],
  },
  {
    slug: "website-experiences",
    number: "04",
    title: "Website\nExperiences",
    shortTitle: "Website Experiences",
    category: "Pages that make banking easier",
    year: "2025–26",
    summary:
      "Banking websites have a lot to say. My job is making it easy to find the part you actually need.",
    challengeTitle: "A lot to explain, very little attention.",
    challenge:
      "These pages had a lot to explain. They also needed to meet compliance requirements, work for search, and help someone decide what to do next. I focused on making the information easier to move through.",
    approachTitle: "Clearer pages, clearer next steps.",
    approach:
      "I designed and built campaign and product pages in WordPress, wrote the copy, and created forms that send inquiries to the right person. I added QR codes and tracking numbers so the team could follow campaign activity, and wrote FAQ content around the questions customers actually ask, which also helps the pages show up in search.",
    outcome:
      "So far, I’ve built more than 20 landing pages and refreshed more than 15 existing pages across four Florida markets. I like figuring out how to make all that banking information easier for someone to use.",
    role: "UX, visual design, writing, forms, and tracking",
    channels: "WordPress, print-to-web campaigns, and search",
    cover: { src: media("web-checking.webp"), alt: "Business checking landing page on a laptop" },
    hero: [{ src: media("web-checking.webp"), alt: "Business checking landing page on a laptop" }],
    featured: true,
    className: "project-card--violet",
    metrics: [
      { value: "20+", label: "New landing pages" },
      { value: "15+", label: "Older pages given a refresh" },
      { value: "4", label: "Florida markets supported" },
    ],
    gallery: [
      {
        layout: "wide",
        src: media("web-collection.webp"),
        alt: "Collection of Florida Capital Bank web pages around a laptop",
        caption: "A few of the pages I’ve built",
      },
      {
        layout: "scroll",
        src: media("web-mobile-wallet.webp"),
        alt: "Full mobile wallet landing page",
        caption: "Mobile wallet page",
        group: [
          { src: media("web-mobile-wallet.webp"), alt: "Full mobile wallet landing page" },
          { src: media("web-uad.webp"), alt: "Full UAD 3.6 appraisal transition page" },
        ],
      },
      {
        layout: "wide",
        src: media("web-jdr-ad.webp"),
        alt: "Jacksonville Daily Record ad and its landing page",
        caption: "From a Jacksonville Daily Record ad to its landing page",
        ratio: "auto",
        group: [
          { src: media("web-jdr-ad.webp"), alt: "Your Business Deserves Better Banking print ad" },
          { src: media("web-jdr-landing.webp"), alt: "Landing page that matched the Jacksonville Daily Record ad" },
        ],
      },
      {
        layout: "right",
        src: media("web-faq.webp"),
        alt: "Business account FAQ section on the bank website",
        caption: "FAQs written around real customer questions",
      },
    ],
  },
  {
    slug: "video",
    number: "05",
    title: "Video &\nSocial",
    shortTitle: "Video & Social",
    category: "Explainers and event content",
    year: "2026",
    summary: "Some things are easier to show than explain. Like how to send a wire.",
    challengeTitle: "Easier to show than tell.",
    challenge:
      "Sending an ACH payment or a wire comes with a lot of questions, and written instructions only go so far when you’re staring at an online banking screen. On the social side, I wanted the Women of the Year event in Orlando to feel as fun online as it did in the room.",
    approachTitle: "Tutorials and a recap.",
    approach:
      "I planned each tutorial with our internal specialists, recorded the steps one screen at a time, and edited them with captions and graphics so customers can follow along at their own pace. For Women of the Year, I put together a short vertical recap for social with bold captions that match the energy of the day.",
    outcome:
      "Customers now have step-by-step ACH and wire guides they can come back to anytime, and the Women of the Year recap brought the event to people who couldn’t be there.",
    role: "Planning, recording, editing, captions, and graphics",
    channels: "Customer education, website, and social media",
    cover: {
      src: media("vid-woy-mockup.mp4"),
      video: "autoplay",
      poster: media("vid-woy-mockup-poster.webp"),
      alt: "Women of the Year social video playing on a phone",
    },
    hero: [
      { src: media("vid-ach.mp4"), video: "autoplay", poster: media("vid-ach-poster.webp"), alt: "ACH tutorial video playing on a laptop" },
      { src: media("vid-woy-mockup.mp4"), video: "autoplay", poster: media("vid-woy-mockup-poster.webp"), alt: "Women of the Year social video playing on a phone" },
      { src: media("vid-wire.mp4"), video: "autoplay", poster: media("vid-wire-poster.webp"), alt: "Wire tutorial video playing on a laptop" },
    ],
    featured: false,
    className: "project-card--yellow",
    gallery: [
      {
        layout: "wide",
        src: media("vid-ach.mp4"),
        video: "controls",
        alt: "ACH and wire tutorial videos",
        caption: "Customer education: ACH and wire guides I planned, recorded, and edited (sound on)",
        ratio: "572 / 714",
        group: [
          { src: media("vid-ach.mp4"), video: "controls", poster: media("vid-ach-poster.webp"), alt: "How to send an ACH payment tutorial video" },
          { src: media("vid-wire.mp4"), video: "controls", poster: media("vid-wire-poster.webp"), alt: "How to send a wire tutorial video" },
        ],
      },
      {
        layout: "tall",
        src: media("vid-woy-social.mp4"),
        video: "controls",
        poster: media("vid-woy-social-poster.webp"),
        alt: "Women of the Year event recap, vertical social video",
        caption: "Event storytelling: a Women of the Year recap for social",
      },
    ],
  },
  {
    slug: "power-of-four",
    number: "06",
    title: "Power of\nFour",
    shortTitle: "Power of Four",
    category: "A capstone campaign for UNF",
    year: "2025",
    summary: "One communication degree was becoming four. Our job was to make that feel like good news.",
    challengeTitle: "One degree becoming four.",
    challenge:
      "UNF’s School of Communication was moving from one general degree to four specialized majors: Advertising, Public Relations, Digital Video Production, and Multimedia Journalism. Students needed to understand what was changing and find the path that fit them.",
    approachTitle: "4X Stronger.",
    approach:
      "I was on the design team. Survey research from our research team shaped the concept, “4X Stronger,” where each major got its own color and line: ideas, stories, voices, and truth, all made stronger. I helped develop the visual direction and designed the campaign plans book. The campaign also included posters, street banners, table tents with QR codes, a chalk takeover, and a passport students could get stamped as they explored each major.",
    outcome: "UNF kept using our campaign work on social media after I graduated.",
    role: "Design team: visual direction and the campaign plans book",
    channels: "Campus print, environmental, social, and a full plans book",
    note: "Team project for the UNF advertising capstone.",
    cover: { src: media("unf-chalk.webp"), alt: "4X Stronger chalk takeover for the four communication majors" },
    hero: [{ src: media("unf-poster.webp"), alt: "Major Changes poster on a campus building" }],
    featured: false,
    className: "project-card--navy",
    gallery: [
      {
        layout: "wide",
        src: media("unf-chalk.webp"),
        alt: "4X Stronger chalk takeover for the four communication majors",
        caption: "The 4X Stronger chalk takeover",
      },
      {
        layout: "wide",
        src: media("unf-passport-front.webp"),
        alt: "UNF 4X passport, front and inside page",
        caption: "A passport for exploring all four majors",
        ratio: "1294 / 2000",
        group: [
          { src: media("unf-passport-front.webp"), alt: "Front of the UNF 4X School of Communication passport" },
          { src: media("unf-passport-back.webp"), alt: "Advertising page of the passport with a stamp here box" },
        ],
      },
      {
        layout: "wide",
        src: media("unf-banner.webp"),
        alt: "Street banner and table tents",
        caption: "Street banners and table tents, each with a QR code",
        ratio: "auto",
        group: [
          { src: media("unf-banner.webp"), alt: "Advertising: Make Ideas Stronger street banner with a QR code" },
          { src: media("unf-table-tent.webp"), alt: "Major Changes table tents with QR codes" },
        ],
      },
    ],
  },
]

export function getProject(slug?: string) {
  return projects.find((project) => project.slug === slug)
}
