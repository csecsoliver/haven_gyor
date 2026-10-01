import type { SiteContent } from '$lib/schema';

export const defaults: SiteContent = {
  meta: {
    title: 'Haven — Győr',
    description: 'An game jam for teens in Győr. Make games, meet friends, and learn something new. Run by Haven Győr, endorsed and sponsored by Hack Club.',
    image: '/images/haven-logo-color.webp'
  },
  nav: { signup: 'Sign up', about: 'About', faq: 'FAQ' },
  tagline: ['Game jam for teens 13-18', 'Nov 14–15 · Győr'],
  hero: {
    organizeCta: 'Want to organize your own Hack Club Haven?',
    mapLabel: 'find an event near you',
    scrollLabel: 'explore the adventure',
    signup: { placeholder: 'you@hackclub.com', button: 'Count me in!' }
  },
  about: {
    title: 'What is a game jam?',
    body: 'It’s a social coding event where you make a video game with friends + free food!',
    perks: [
      {
        title: 'Learn & Build', side: 'start',
        blurb: ['follow workshops or create at your own pace'],
        photos: [
          { src: '/images/projects-1.webp', alt: 'Return to the Sender, a game made at a past event', href: 'https://i1rs7.itch.io/return-to-the-sender', caption: { title: 'return to the sender', author: 'by i1rs7' } },
          { src: '/images/projects-3.webp', alt: 'Office Click Clack, a game made at a past event', href: 'https://theavgeekbee.itch.io/office-click-clack', caption: { title: 'office click clack', author: 'by bunnyguy and nathan' } }
        ]
      },
      {
        title: 'Make Friends', side: 'end',
        blurb: ['meet new people and form lifelong relationships'],
        photos: [
          { src: '/images/friends-1.webp', alt: 'Attendees hanging out together' },
          { src: '/images/friends-2.webp', alt: 'A group of teens working at a shared table' }
        ]
      },
      {
        title: 'Free Food & Prizes', side: 'start',
        blurb: ['can’t say no to free snacks :)'],
        photos: [
          { src: '/images/food-1.webp', alt: 'A spread of snacks and merch' },
          { src: '/images/food-3.webp', alt: 'Attendees holding up their prizes' }
        ]
      }
    ]
  },
  pitch: {
    heading: 'Don’t game jams sound awesome?',
    items: [
      { align: 'end', body: [{ text: 'Yes, you can make a game.', mark: true }, { text: ' It doesn’t matter if you have years of experience, or just learned what game jams are today.' }] },
      { align: 'start', body: [{ text: 'Join other curious teens', mark: true }, { text: ' making games together. Don’t consider yourself a game dev? No problem — learn as you go!' }] },
      { align: 'center', body: [{ text: 'This is your chance to ' }, { text: 'learn something new,', mark: true }, { text: ' ' }, { text: 'meet new friends,', mark: true }, { text: ' and ' }, { text: 'go on an incredible adventure together!', mark: true }] }
    ]
  },
  steps: {
    heading: 'Here is how you can join a game jam!',
    subheading: '(Don’t worry, we’ll guide you through each step)',
    cta: { label: 'Read the organizer guide for more info!', href: 'https://docs.google.com/document/d/1CHgiBmXzeSj7Ng21wMoXsnwjzrLzSbg0siVn8AUoqQ0/edit' }
  },
  schedule: {
    heading: 'What happens on the day?',
    tbd: { title: 'Coming soon!', body: 'The Haven Győr date, venue, and schedule are still being confirmed. Check back for updates.' },
    days: []
  },
  pastEvents: {
    heading: ['Hack Club has helped teens organize hundreds of events worldwide!', 'A little inspiration from past events ~'],
    items: [
      { title: 'Scrapyard', caption: 'Build wacky stuff, get wacky prizes! In-person hackathon in 70+ cities.', image: '/images/scrapyard-pic.webp', alt: 'Teens building at Scrapyard', play: '/images/play-triangle-1.svg', href: 'https://www.youtube.com/watch?v=8iM1W8kXrQA' },
      { title: 'Daydream', caption: 'Students led game jams in 200 cities worldwide, from London to NYC to Penang!', image: '/images/daydream-pic.webp', alt: 'Attendees at a Daydream game jam', play: '/images/play-triangle-2.svg', href: 'https://www.youtube.com/watch?v=vvdoW2gh9YU' },
      { title: 'Campfire', caption: 'Our largest game jam yet: 10k teens, 1 weekend, making games at the same time!', image: '/images/scrapyard-pic-2.webp', alt: 'A packed room of teens at Campfire', play: '/images/play-triangle-3.svg', href: 'https://www.youtube.com/watch?v=0aMAHuLxg3s', position: 'object-bottom' }
    ]
  },
  sponsors: { heading: 'Our sponsors', items: [] },
  faq: {
    heading: 'FAQ', cta: 'Sign up!',
    items: [
      { q: 'Am I eligible?', a: [{ text: 'If you’re age 13-18, you’re eligible! No prior experience required.' }] },
      { q: 'Can I organize a Haven?', a: [{ text: 'Absolutely! We’re always looking for passionate organizers. If you’re ready to bring the magic of game development to your community, we’d love to help.' }] },
      { q: 'Is this free?', a: [{ text: 'Yes! Hack Club is a nonprofit helping teens build technical projects at no cost.' }] },
      { q: 'Why should I organize a Haven?', a: [{ text: 'You’ll make an impact on your community, whether inspiring someone to make their first game or helping someone find friends in tech. Leading an event is usually very difficult, but we are providing support to help you along the way!' }] },
      { q: 'But I’ve never coded before!', a: [{ text: 'Perfect! Game jams are designed for beginners. You’ll have workshops, mentors, and teammates to help you every step of the way.' }] },
      { q: 'What are the steps to organizing?', a: [{ text: 'First, apply through our organizer form. Then we’ll guide you through venue booking, team building, workshop planning, and day-of coordination.' }] },
      { q: 'What if my parents are concerned?', a: [{ text: 'We’re here to help! You can see our ' }, { text: 'parent guide', href: 'https://docs.google.com/document/d/1f_uFvFP4gD01YhXBmU9jBfEBU9QMvr1L5yJTKWBBhbA/edit?usp=sharing' }, { text: ' here, or they can reach out to us at ' }, { text: 'haven@hackclub.com', href: 'mailto:haven@hackclub.com' }, { text: ' for questions.' }] },
      { q: 'Do we get volunteer hours?', a: [{ text: 'Many schools accept organizing hours as community service. If your school requires documentation, we can provide it!' }] },
      { q: 'I still have questions!', a: [{ text: 'Join #haven-help on ' }, { text: 'Slack', href: 'https://hackclub.com/slack/' }, { text: ' or reach out to us at ' }, { text: 'haven@hackclub.com', href: 'mailto:haven@hackclub.com' }, { text: '!' }] },
      { q: 'Can I join an organizing team?', a: [{ text: 'Of course! Many cities have organizing teams. Reach out to organizers in your area or apply to join an existing team.' }] }
    ]
  },
  footer: {
    body: [
      [{ text: 'Hack Club is a 501(c)(3) nonprofit and network of 100k+ technical high schoolers. We believe you learn best by building, so we’re creating community and providing grants so you can make awesome projects.' }],
      [{ text: 'Explore the community at ' }, { text: 'hackclub.com', href: 'https://hackclub.com/' }, { text: '. Haven Győr is independently organized, not run by Hack Club HQ.' }]
    ],
    links: { hackClub: 'Hack Club', slack: 'Slack', clubs: 'Clubs', hackathons: 'Hackathons' }
  },
  fonts: { display: 'Patrick Hand', body: 'DM Sans' },
  images: {}
};
