import { GameCategoryDefinition } from '../types';

export const GAME_CATEGORIES: GameCategoryDefinition[] = [
  {
    id: 'lottery',
    name: 'Lottery',
    title: 'Color & Fast Lottery Predictions',
    tagline: 'High-frequency 60s/3m cryptographic lotteries with up to 216x payout',
    description: 'The Lottery category consists of fast-cycle prediction games where players anticipate numbers, colors, dice sums, or cryptographic hash results. Draws take place automatically on fixed timers (30s, 1m, 3m, 5m), utilizing SHA-256 block seeds to guarantee 100% tamper-proof outcome transparency.',
    howItWorks: 'Choose your period duration (e.g. Win Go 1 Min). Select your prediction: Color (Green, Violet, Red), Number (0–9), or Size (Big/Small). Once the countdown expires, the winning result is drawn and winning balances are instantly credited.',
    payoutRange: '1.92x – 216.00x',
    volatility: 'Medium',
    drawInterval: '30s / 1 min / 3 min / 5 min',
    provablyFairMethod: 'Cryptographic SHA-256 Hash + TRON Block Seed',
    keyRules: [
      'Green Win: Numbers 1, 3, 7, 9 return 2x stake (minus 3% service charge). If number 5 appears, returns 1.5x.',
      'Red Win: Numbers 2, 4, 6, 8 return 2x stake (minus 3% service charge). If number 0 appears, returns 1.5x.',
      'Violet Win: Number 0 or 5 awards 4.5x multiplier.',
      'Single Number (0–9): Exact number hit awards a massive 9x multiplier.',
      'Big (5–9) / Small (0–4): Standard binary prediction returning 1.96x payout.',
      'K3 3-Dice: Sum of 3 dice from 3 to 18; matching triples award 216x.'
    ],
    payoutStructure: [
      { betType: 'Single Number (0–9)', multiplier: '9.00x', description: 'Exact hit on drawn single digit' },
      { betType: 'Color: Violet', multiplier: '4.50x', description: 'Drawn number has violet hue (0 or 5)' },
      { betType: 'Color: Green / Red', multiplier: '2.00x', description: 'Standard primary color victory' },
      { betType: 'Size: Big / Small', multiplier: '1.96x', description: 'Big (5,6,7,8,9) or Small (0,1,2,3,4)' },
      { betType: 'K3 Matching Triples', multiplier: '216.0x', description: 'Three identical dice numbers (e.g. 6-6-6)' },
      { betType: 'TRX Hash Last Digit', multiplier: '9.00x', description: 'Matches hexadecimal/decimal TRON block hash' }
    ],
    featuredGames: [
      {
        name: 'Win Go 1M Continuous',
        multiplier: 'Up to 9x',
        badge: 'Flagship',
        desc: '60-second rapid color & number prediction with live trend charts.',
        iconName: 'Flame',
        gameRoute: 'wingo'
      },
      {
        name: 'K3 Lotre 3-Dice',
        multiplier: 'Up to 216x',
        badge: 'High Multiplier',
        desc: 'Traditional 3-dice lottery with triples, doubles, and total sum wagers.',
        iconName: 'Dices',
        gameRoute: 'k3'
      },
      {
        name: 'TRX Hash Win Go',
        multiplier: 'Up to 9x',
        badge: 'Crypto Verified',
        desc: 'Provably fair results derived directly from real-time TRON blockchain blocks.',
        iconName: 'Coins',
        gameRoute: 'trx'
      }
    ]
  },
  {
    id: 'original',
    name: 'Originals',
    title: 'Provably Fair Crash & Arcade',
    tagline: 'High-adrenaline multiplier curve with user-controlled cashout timing',
    description: 'The Originals category features in-house crash and skill-timing games like Aviator and Mines. Watch multiplier curves surge upward or evade hidden bombs on a 5x5 grid.',
    howItWorks: 'Place your wager before the round takes off. Watch the multiplier climb in realistic Spribe pacing. Click "Cash Out" before the crash occurs to lock in your profit: Payout = Bet Amount × Multiplier at cashout.',
    payoutRange: '1.01x – 100.00x+',
    volatility: 'Very High',
    drawInterval: 'Real-time Continuous (38s rounds)',
    provablyFairMethod: 'Client Seed + Server Seed HMAC-SHA512 verification',
    keyRules: [
      'Cashing out before the crash secures the multiplier displayed on screen at that exact moment.',
      'If the round crashes before you cash out, the wager for that round is forfeited.',
      'Auto-Cashout allows you to configure a target multiplier (e.g. 2.00x) that triggers automatically.',
      'Mines Arcade allows uncovering diamonds while evading hidden bombs with instant cashout anytime.'
    ],
    payoutStructure: [
      { betType: 'Low Altitude Cashout (1.20x–1.50x)', multiplier: '1.20x–1.50x', description: 'High frequency, low volatility tactical hedging' },
      { betType: 'Medium Altitude Cashout (2.00x–5.00x)', multiplier: '2.00x–5.00x', description: 'Balanced risk-reward target for core strategy' },
      { betType: 'High Altitude Stratosphere (10.0x–50.0x)', multiplier: '10.0x–50.0x', description: 'Long-flight rocket climb for aggressive returns' },
      { betType: 'Mines 24-Diamond Clear', multiplier: '100.0x+', description: 'Uncovering safe diamonds without hitting any bombs' }
    ],
    featuredGames: [
      {
        name: 'Aviator Continuous',
        multiplier: 'Up to 100x',
        badge: 'Trending #1',
        desc: 'Next-generation multiplayer flight crash game with authentic Spribe pacing.',
        iconName: 'PlaneTakeoff',
        gameRoute: 'aviator'
      },
      {
        name: 'Mines VIP Arcade',
        multiplier: 'Up to 100x',
        badge: 'Instant Cashout',
        desc: '5x5 diamond grid. Uncover gems, evade bombs, and cash out profit anytime.',
        iconName: 'Gem',
        gameRoute: 'mines'
      }
    ]
  },
  {
    id: 'slots',
    name: 'Slots',
    title: 'Digital Video Reels & Jackpots',
    tagline: 'Multi-payline video reels with expanding wilds, scatters & free spins',
    description: 'The Slots category delivers Vegas-style digital reel spinning mechanics powered by certified Random Number Generators (RNG). Players spin sets of 3 reels seeking matching symbol combinations.',
    howItWorks: 'Set your coin denomination and spin the reels. Hitting 3 matching Lucky 7s awards the 50x Mega Jackpot.',
    payoutRange: '1.00x – 50.00x Jackpot',
    volatility: 'High',
    drawInterval: 'Instant (Player triggered spins)',
    provablyFairMethod: 'Certified RNG with certified 97.0% Return-to-Player (RTP)',
    keyRules: [
      'Payouts are determined by the paytable symbol combinations across the center payline.',
      'Three Lucky 7s trigger the maximum 50x jackpot payout.',
      'Diamonds, Crowns, Stars, Bells, and Cherries provide tiered payouts down to 2x.'
    ],
    payoutStructure: [
      { betType: '7️⃣ 7️⃣ 7️⃣ Lucky 7s', multiplier: '50.0x', description: 'Triple Lucky 7s jackpot line' },
      { betType: '💎 💎 💎 Diamonds', multiplier: '25.0x', description: 'Triple shining blue diamonds' },
      { betType: '👑 👑 👑 Gold Crowns', multiplier: '20.0x', description: 'Triple royal VIP crowns' },
      { betType: '🍒 🍒 Any Two Cherries', multiplier: '2.0x', description: 'Two matching cherries on reel' }
    ],
    featuredGames: [
      {
        name: '777 Vegas VIP Slots',
        multiplier: 'Up to 50x',
        badge: 'Hot Slot',
        desc: 'Classic Vegas 3-reel high-roller slot machine with instant spin payouts.',
        iconName: 'Sparkles',
        gameRoute: 'slots'
      }
    ]
  },
  {
    id: 'casino',
    name: 'Casino',
    title: 'Live Dealer & Table Classics',
    tagline: 'Live streaming dealer tables with authentic casino rules & lightning odds',
    description: 'The Casino category recreates the high-stakes atmosphere of world-class brick-and-mortar casino tables. Features Dragon Tiger and live card tables with standardized rules.',
    howItWorks: 'Select your preferred table. Place chips on Dragon, Tiger, or Tie during the 18-second betting window. The dealer deals single cards to each side, highest card wins.',
    payoutRange: '2.00x – 9.00x',
    volatility: 'Low – Medium',
    drawInterval: '18s per round',
    provablyFairMethod: 'Visible physical card decks and optical shoe recognition',
    keyRules: [
      'Dragon Tiger: Highest single card wins (King high, Ace low). Dragon pays 2x, Tiger pays 2x, Tie pays 9x.',
      'All bets must be placed and confirmed before the dealing countdown reaches zero.'
    ],
    payoutStructure: [
      { betType: 'Dragon Bet', multiplier: '2.00x', description: 'Dragon receives higher card than Tiger' },
      { betType: 'Tiger Bet', multiplier: '2.00x', description: 'Tiger receives higher card than Dragon' },
      { betType: 'Tie Bet', multiplier: '9.00x', description: 'Both Dragon and Tiger receive cards of identical rank' }
    ],
    featuredGames: [
      {
        name: 'Dragon Tiger VIP',
        multiplier: 'Up to 9x',
        badge: '18s Fast',
        desc: 'Rapid 18-second card showdown. Dragon vs Tiger high card duel.',
        iconName: 'Swords',
        gameRoute: 'dragontiger'
      }
    ]
  }
];
