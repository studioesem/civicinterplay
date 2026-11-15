// Signature photos for cards that have no photo
// (What's new text tiles) and the Anthropic post cards. Black and white with
// logo dots, as in the Image templates.

export type Sig = { src: string; pos?: string; dots: [string, number, number][] };

const P = '/images/people/';
export const sig = {
  spiral:   { src: '/images/spiral-staircase.webp', pos: '50% 60%', dots: [['#A27C4E', 86, 10], ['#13608A', 14, 88]] },
  radio:    { src: P + 'radio-ny.webp', pos: '40% 50%', dots: [['#13608A', 88, 8], ['#B47DB5', 50, 94]] },
  digging:  { src: P + 'digging.webp', pos: '50% 50%', dots: [['#A8C1CE', 14, 12], ['#AB5A6D', 22, 88]] },
  handstand:{ src: P + 'handstand.webp', pos: '50% 50%', dots: [['#B47DB5', 12, 44], ['#A8C1CE', 70, 84]] },
  denes:    { src: P + 'denes.webp', pos: '50% 50%', dots: [['#7A7F66', 90, 12], ['#13608A', 84, 88]] },
  amazon:   { src: P + 'amazon-1992.webp', pos: '50% 50%', dots: [['#9BA557', 82, 8], ['#E1EADD', 66, 90]] },
  workshop: { src: P + 'workshop.webp', pos: '50% 40%', dots: [['#B47DB5', 90, 10], ['#A8C1CE', 10, 88]] },
  dataCentre: { src: P + 'data-centre.webp', pos: '50% 50%', dots: [['#AB5A6D', 88, 12], ['#A8C1CE', 12, 88]] },
  core:     { src: P + 'core-memory.webp', pos: '50% 50%', dots: [['#A27C4E', 88, 10], ['#B47DB5', 12, 88]] },
} satisfies Record<string, Sig>;

// What's new tiles that are text graphics only.
export const tileSig: Record<string, Sig> = {
  submission: sig.dataCentre,
  facts: sig.core,
  friends: sig.spiral,
  listening: sig.radio,
  method: sig.digging,
  player: sig.handstand,
  terrain: sig.denes,
  toolkit: sig.workshop,
};

// Post cards, by link. The Anthropic posts currently use screengrabs.
export const postSig: Record<string, Sig> = {
  '/anthropic-civitas/': sig.core,
  '/jack-clark-on-ai/': sig.spiral,
  '/dario-amodei-on-cnn/': sig.radio,
};
