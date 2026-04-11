import type { Card } from 'shared'

/**
 * Full card pool
 *
 * Fill entries here by hand. Rules:
 *   - id must be "{set}_{serialNumber}" and unique across all entries
 *   - image filename is relative to server/static/cards/
 *   - Serial numbers 1–999: regular cards
 *   - Serial numbers 1000+: legend cards (must have type: 'legend')
 */
export const cards: Card[] = [

  // ── Regular cards ────────────────────────────────────────────────────────

  {
    id: 'alpha_1',
    serialNumber: 1,
    set: 'alpha',
    name: 'Street Samurai',
    subtitle: 'Blade for hire',
    type: 'unit',
    rarity: 'common',
    tags: ['runner', 'weapon', 'cyber'],
    ram: 2,
    cost: 3,
    power: 4,
    sellTag: false,
    abilities: [
      {
        name: 'Quick Draw',
        description: 'When this unit attacks, deal 1 extra damage.',
        trigger: 'on_attack',
        effect: { bonus_damage: 1 },
      },
    ],
    image: 'card_001.png',
  },
  {
    id: 'alpha_2',
    serialNumber: 2,
    set: 'alpha',
    name: 'ICE Wall',
    subtitle: null,
    type: 'hardware',
    rarity: 'common',
    tags: ['corp', 'cyber'],
    ram: 1,
    cost: 2,
    power: 0,
    sellTag: false,
    abilities: [
      {
        name: 'Firewall',
        description: 'Passively reduces all incoming breach damage by 1.',
        trigger: 'passive',
        effect: { damage_reduction: 1, damage_type: 'breach' },
      },
    ],
    image: 'card_002.png',
  },
  {
    id: 'alpha_3',
    serialNumber: 3,
    set: 'alpha',
    name: 'Neural Spike',
    subtitle: 'Direct upload',
    type: 'event',
    rarity: 'uncommon',
    tags: ['runner', 'viral'],
    ram: 3,
    cost: 4,
    power: 0,
    sellTag: true,
    abilities: [
      {
        name: 'Data Burn',
        description: 'Deal 3 damage to target unit. If it has the "ai" tag, deal 5 instead.',
        trigger: 'on_play',
        effect: { damage: 3, bonus_vs_tag: 'ai', bonus_damage: 5 },
      },
    ],
    image: 'card_003.png',
  },
  {
    id: 'alpha_4',
    serialNumber: 4,
    set: 'alpha',
    name: 'Corporate Drone',
    subtitle: null,
    type: 'unit',
    rarity: 'common',
    tags: ['corp', 'drone', 'ai'],
    ram: 1,
    cost: 1,
    power: 1,
    sellTag: false,
    abilities: [],
    image: 'card_004.png',
  },
  {
    id: 'alpha_5',
    serialNumber: 5,
    set: 'alpha',
    name: 'Black Market Hub',
    subtitle: 'Everything has a price',
    type: 'location',
    rarity: 'rare',
    tags: ['runner'],
    ram: 2,
    cost: 5,
    power: 0,
    sellTag: true,
    abilities: [
      {
        name: 'Under the Counter',
        description: 'At the start of your turn, gain 1 extra RAM if you control a unit with sellTag.',
        trigger: 'passive',
        effect: { ram_gain: 1, condition: 'friendly_sell_tag' },
      },
    ],
    image: 'card_005.png',
  },

  // ── Legend cards (type: 'legend', serialNumber 1000+) ────────────────────

  {
    id: 'alpha_1000',
    serialNumber: 1000,
    set: 'alpha',
    name: 'Ghost Protocol',
    subtitle: 'The shadow behind every breach',
    type: 'legend',
    rarity: 'legendary',
    tags: ['runner', 'stealth', 'ai'],
    ram: 5,
    cost: 8,
    power: 7,
    sellTag: false,
    abilities: [
      {
        name: 'Untraceable',
        description: 'This unit cannot be targeted by corp abilities.',
        trigger: 'passive',
        effect: { untargetable_by: 'corp' },
      },
      {
        name: 'System Breach',
        description: 'On attack, force the opponent to discard a card.',
        trigger: 'on_attack',
        effect: { opponent_discard: 1 },
      },
    ],
    image: 'legend_1000.png',
  },
  {
    id: 'alpha_1001',
    serialNumber: 1001,
    set: 'alpha',
    name: 'Axiom-9',
    subtitle: 'Corporate intelligence incarnate',
    type: 'legend',
    rarity: 'legendary',
    tags: ['corp', 'ai', 'cyber'],
    ram: 4,
    cost: 7,
    power: 6,
    sellTag: true,
    abilities: [
      {
        name: 'Predictive Grid',
        description: 'Passive: you may look at the top card of your deck at any time.',
        trigger: 'passive',
        effect: { reveal_top_card: true },
      },
      {
        name: 'Override',
        description: 'Activated: take control of a friendly drone unit until end of turn.',
        trigger: 'activated',
        effect: { control_tag: 'drone', duration: 'end_of_turn' },
      },
    ],
    image: 'legend_1001.png',
  },
  {
    id: 'alpha_1002',
    serialNumber: 1002,
    set: 'alpha',
    name: 'Vex, the Viral Storm',
    subtitle: null,
    type: 'legend',
    rarity: 'legendary',
    tags: ['runner', 'viral', 'breach'],
    ram: 6,
    cost: 10,
    power: 9,
    sellTag: false,
    abilities: [
      {
        name: 'Cascade',
        description: 'When played, deal 2 damage to every corp unit.',
        trigger: 'on_play',
        effect: { aoe_damage: 2, target_tag: 'corp' },
      },
      {
        name: 'Viral Spread',
        description: 'On death, place a 1/1 Virus token.',
        trigger: 'on_death',
        effect: { spawn: { name: 'Virus', power: 1, tags: ['viral'] } },
      },
    ],
    image: 'legend_1002.png',
  },
]
