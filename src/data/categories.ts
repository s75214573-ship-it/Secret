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
      'Green Win: Numbers 1, 3, 7, 9 return 2x stake (minus 2% service charge). If number 5 appears, returns 1.5x.',
      'Red Win: Numbers 2, 4, 6, 8 return 2x stake (minus 2% service charge). If number 0 appears, returns 1.5x.',
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
        name: 'Win Go 1M / 3M',
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
        name: 'TRX Hash Win',
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
    description: 'The Originals category features in-house crash and skill-timing games like Aviator. Unlike traditional fixed-odds games, players watch a multiplier curve surge upward from 1.00x to over 100x in real-time. Players decide the exact millisecond to cash out before the jet flies away or the round terminates.',
    howItWorks: 'Place your wager before the round takes off. Once the jet takes flight, the multiplier climbs exponentially. Click "Cash Out" before the crash occurs to lock in your profit: Payout = Bet Amount × Multiplier at cashout.',
    payoutRange: '1.01x – 100.00x+',
    volatility: 'Very High',
    drawInterval: 'Real-time Continuous (8–15s rounds)',
    provablyFairMethod: 'Client Seed + Server Seed HMAC-SHA512 verification',
    keyRules: [
      'Cashing out before the crash secures the multiplier displayed on screen at that exact moment.',
      'If the round crashes before you cash out, the wager for that round is forfeited.',
      'Auto-Cashout allows you to configure a target multiplier (e.g. 2.00x) that triggers automatically.',
      'Double Bet Panel allows two independent wagers with separate cashout strategies in the same flight.',
      'Provably Fair seed hashes can be checked in round history to verify that crash points are pre-determined and unaltered.'
    ],
    payoutStructure: [
      { betType: 'Low Altitude Cashout (1.20x–1.50x)', multiplier: '1.20x–1.50x', description: 'High frequency, low volatility tactical hedging' },
      { betType: 'Medium Altitude Cashout (2.00x–5.00x)', multiplier: '2.00x–5.00x', description: 'Balanced risk-reward target for core strategy' },
      { betType: 'High Altitude Stratosphere (10.0x–50.0x)', multiplier: '10.0x–50.0x', description: 'Long-flight rocket climb for aggressive returns' },
      { betType: 'Supersonic Supernova (100.0x+)', multiplier: '100.0x+', description: 'Exceptional jackpot run reaching outer orbit' }
    ],
    featuredGames: [
      {
        name: 'Aviator Crashout',
        multiplier: 'Up to 100x',
        badge: 'Trending #1',
        desc: 'Next-generation multiplayer crash game with real-time spectator cashouts.',
        iconName: 'PlaneTakeoff',
        gameRoute: 'aviator'
      },
      {
        name: 'Space Rocket X',
        multiplier: 'Up to 250x',
        badge: 'New Release',
        desc: 'Interstellar rocket climb with ejection seats and dual-bet insurance.',
        iconName: 'Zap',
        gameRoute: 'aviator'
      }
    ]
  },
  {
    id: 'slots',
    name: 'Slots',
    title: 'Digital Video Reels & Jackpots',
    tagline: 'Multi-payline video reels with expanding wilds, scatters & free spins',
    description: 'The Slots category delivers Vegas-style digital reel spinning mechanics powered by certified Random Number Generators (RNG). Players spin sets of 3, 5, or 6 reels seeking matching symbol combinations along designated paylines, unlocking bonus rounds, sticky wilds, and progressive jackpot drops.',
    howItWorks: 'Set your coin denomination and spin the reels. Winning paylines pay left-to-right. Hitting 3 or more Scatter symbols triggers the Free Spins feature with progressive win multipliers.',
    payoutRange: '1.00x – 1,000.00x+ Jackpot',
    volatility: 'High',
    drawInterval: 'Instant (Player triggered spins)',
    provablyFairMethod: 'Certified RNG with certified 96.8% Return-to-Player (RTP)',
    keyRules: [
      'Payouts are determined by the paytable symbol combinations across active paylines.',
      'Wild symbols substitute for any standard paying symbol to complete winning combinations.',
      'Scatter symbols award bonus free spins regardless of their position on the grid.',
      'Jackpot meters accumulate a percentage of all network bets and can trigger on any spin.'
    ],
    payoutStructure: [
      { betType: 'Standard Symbol Line', multiplier: '1.5x–15.0x', description: '3 to 5 matching fruits or card symbols' },
      { betType: 'Premium Character Line', multiplier: '20.0x–100.0x', description: 'Full payline of high-tier themed symbols' },
      { betType: 'Free Spins Bonus Round', multiplier: '50.0x–300.0x', description: '10+ free spins with stacking multiplier boosts' },
      { betType: 'Mega Jackpot Drop', multiplier: '1,000.0x+', description: 'Full screen matching Wild 777 symbols' }
    ],
    featuredGames: [
      {
        name: 'Super 777 Deluxe',
        multiplier: 'Up to 1000x',
        badge: 'Hot Slot',
        desc: 'Classic Vegas 5-reel slot with fiery multipliers and jackpot drops.',
        iconName: 'Gamepad2',
        gameRoute: 'slots'
      },
      {
        name: 'Fortune Dragon Reels',
        multiplier: 'Up to 500x',
        badge: 'Popular',
        desc: 'Cascading reels with progressive multiplier cascades and golden coin scatters.',
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
    description: 'The Casino category recreates the high-stakes atmosphere of world-class brick-and-mortar casino tables. Features real-time high-definition dealer streams and interactive table layouts for Baccarat, Roulette, Dragon Tiger, Andar Bahar, and Blackjack with standardized international gaming rules.',
    howItWorks: 'Select your preferred table. Place chips on the betting layout (Player, Banker, Tie, Red, Black, etc.) during the designated 15-second betting window. The live dealer draws cards or spins the wheel, and winning wagers are immediately settled.',
    payoutRange: '1.00x – 36.00x',
    volatility: 'Low – Medium',
    drawInterval: '20s – 45s per round',
    provablyFairMethod: 'Visible physical card decks, optical shoe recognition & video feed',
    keyRules: [
      'Baccarat: Player pays 1:1, Banker pays 0.95:1 (5% house commission), Tie pays 8:1 or 9:1.',
      'Dragon Tiger: Highest card wins (King high, Ace low). Dragon pays 1:1, Tiger pays 1:1, Tie pays 8:1.',
      'Roulette: Straight single number pays 35:1; Red/Black, Odd/Even pay 1:1; Dozens pay 2:1.',
      'All bets must be placed and confirmed before the dealer announces "No More Bets".'
    ],
    payoutStructure: [
      { betType: 'Baccarat: Player Bet', multiplier: '1.00x (1:1)', description: 'Player hand finishes closer to 9 than Banker' },
      { betType: 'Baccarat: Banker Bet', multiplier: '0.95x (1:0.95)', description: 'Banker hand finishes closer to 9 (5% commission)' },
      { betType: 'Baccarat: Tie Bet', multiplier: '8.00x (8:1)', description: 'Both Player and Banker finish with identical score' },
      { betType: 'Roulette: Straight Up', multiplier: '35.00x', description: 'Single specific pocket on European 37-number wheel' },
      { betType: 'Dragon Tiger: Primary', multiplier: '1.00x (1:1)', description: 'Correct prediction of higher card between Dragon & Tiger' }
    ],
    featuredGames: [
      {
        name: 'VIP Speed Baccarat',
        multiplier: 'Up to 9x',
        badge: 'Live HD',
        desc: 'Lightning-fast 15-second card dealing with roadmaps and side bets.',
        iconName: 'Crown',
        gameRoute: 'wingo'
      },
      {
        name: 'Live European Roulette',
        multiplier: 'Up to 36x',
        badge: 'Classic',
        desc: 'Single-zero 37-number wheel with racetrack call bets and stats.',
        iconName: 'CircleDot',
        gameRoute: 'wingo'
      }
    ]
  },
  {
    id: 'sports',
    name: 'Sports',
    title: 'Sportsbook & Match Exchanges',
    tagline: 'Live cricket, football & kabaddi match odds with over-by-over live markets',
    description: 'The Sports category provides live event wagering across domestic and international cricket (IPL, ICC), football (EPL, Champions League), tennis, and kabaddi. Features dynamic real-time odds, match winner lines, toss predictions, and ball-by-ball micro-markets.',
    howItWorks: 'Browse live and upcoming fixtures. Select your market (Match Winner, Over Total Runs, Player of the Match). Confirm your slip to lock in the decimal odds. Settlements occur immediately upon official match validation.',
    payoutRange: '1.10x – 50.00x+',
    volatility: 'Medium',
    drawInterval: 'Match-based live updating odds',
    provablyFairMethod: 'Official sporting board scorecards & certified match feeds',
    keyRules: [
      'Bets on abandoned matches without sufficient overs bowled are refunded according to cricket rule guidelines.',
      'Toss bets are settled immediately after the official referee coin toss.',
      'Live in-play odds fluctuate dynamically based on game state, wickets, and run rates.'
    ],
    payoutStructure: [
      { betType: 'Match Winner Favorite', multiplier: '1.20x–1.80x', description: 'Backing the favored squad to secure victory' },
      { betType: 'Match Winner Underdog', multiplier: '2.10x–5.00x', description: 'High-value odds backing the underdog team' },
      { betType: 'Total Sixes / Over-Runs', multiplier: '1.90x', description: 'Over/Under lines on match boundary totals' }
    ],
    featuredGames: [
      {
        name: 'Cricket Premier League Live',
        multiplier: 'Dynamic Odds',
        badge: 'Live In-Play',
        desc: 'Ball-by-ball live betting with instant over score and boundary props.',
        iconName: 'Trophy',
        gameRoute: 'wingo'
      }
    ]
  },
  {
    id: 'pvc',
    name: 'Card & PVC',
    title: 'P2P Card Rooms & Skill Tables',
    tagline: 'Multiplayer skill-based card tables including Rummy, Teen Patti & Poker',
    description: 'The PVC (Player vs Computer / Player vs Player) category features peer-to-peer card tables where players test their strategy and skill against other real players. Point values and pot allocations are determined transparently based on deck ranking combinations.',
    howItWorks: 'Join a table corresponding to your preferred buy-in stakes (e.g. ₹10, ₹50, ₹500). Players receive standard card deals and take turns melding sets/sequences or betting rounds until showdown.',
    payoutRange: 'Pot-based / Point Multipliers',
    volatility: 'Medium',
    drawInterval: 'Continuous table hands',
    provablyFairMethod: 'Cryptographic RNG deck shuffler certified by iTech Labs',
    keyRules: [
      'Points Rummy: Played with 13 cards; players must form at least 2 sequences (one must be pure).',
      'Teen Patti: 3-card ranking order: Trail (Trio) > Pure Sequence > Sequence > Color > Pair > High Card.',
      'Tables enforce strict turn timers (15 seconds) to ensure fluid, active game momentum.'
    ],
    payoutStructure: [
      { betType: 'Points Rummy Hand Win', multiplier: 'Score Based', description: 'Winnings = (Sum of opponent points) × Point Value - Rake' },
      { betType: 'Teen Patti Pot Win', multiplier: 'Pot Based', description: 'Winner takes all accumulated pot chips on table' }
    ],
    featuredGames: [
      {
        name: '13-Card Points Rummy',
        multiplier: 'Skill Scaled',
        badge: 'Classic Indian',
        desc: 'Fast-paced multiplayer rummy tables with automated card sorting.',
        iconName: 'Award',
        gameRoute: 'wingo'
      }
    ]
  }
];
