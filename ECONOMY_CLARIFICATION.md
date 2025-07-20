# Oil Extraction Game Economy System

## 🎯 **CRITICAL DISTINCTION: Coins vs Net Worth**

**These are TWO SEPARATE currencies with DIFFERENT purposes:**

### 💰 **COINS (Orange) - Used for PLAYING**
- **Start with:** 0 coins
- **Earned by:** Real-life mini-games (added by admins)
- **Used for:** 
  - Excavation (100 coins per square)
  - Buying hints (variable cost)
- **NOT used for:** Winning the game
- **Affects:** Only coin balance, never net worth

### 🏆 **NET WORTH (Green) - Used for WINNING**
- **Start with:** 0 net worth
- **Earned by:** Selling oil barrels to shop owners ONLY
- **Used for:** Determining the winner
- **NOT affected by:** Spending coins on excavation or hints
- **Affects:** Only net worth, never coins

## 🔄 **Complete Game Flow**

1. **Teams start with 0 coins and 0 net worth**

2. **Admins add coins via real-life mini-games**
   - Admins use `/oil-extraction/admin` to add coins
   - Increments: 25, 50, 75, or 100 coins
   - Logged in `coin_transactions` table

3. **Teams spend coins on excavation and hints**
   - **Excavation:** 100 coins per square
   - **Hints:** Variable cost per hint
   - Both deduct from coins only (not net worth)

4. **Excavation gives 1 barrel per time**
   - Each excavation costs 100 coins
   - Each excavation gives exactly 1 barrel
   - Barrel quality is random (common, rare, epic, legendary, mythic)

5. **Teams sell barrels to shop owners**
   - Only shop owners can buy barrels
   - Fixed prices: Common (25), Rare (50), Epic (100), Legendary (150), Mythic (250)
   - Sales increase net worth only (not coins)

6. **Team with highest net worth wins**
   - Net worth is the winning currency
   - Coins are only for playing, not winning

## ✅ **Database Implementation Verification**

### **Excavation Function:**
```sql
-- Deducts coins only
UPDATE team_wallets SET coins = coins - 100 WHERE team_id = current_team;
-- Does NOT affect net_worth
```

### **Oil Sales Function:**
```sql
-- Increases net_worth only
UPDATE team_wallets SET net_worth = net_worth + total_amount WHERE team_id = team_id_param;
-- Does NOT affect coins
```

### **Hint Purchase Function:**
```sql
-- Deducts coins only
UPDATE team_wallets SET coins = coins - hint_cost WHERE team_id = current_team;
-- Does NOT affect net_worth
```

## 🎮 **UI Implementation**

### **Visual Distinction:**
- **Orange theme** for coins (spending currency)
- **Green theme** for net worth (winning currency)
- **Clear labels** throughout the interface
- **Explanatory text** on all relevant pages

### **Key Messages Displayed:**
- "Coins: Used for playing the game"
- "Net Worth: Used to win the game"
- "Coins ≠ Net Worth"
- "This is how you WIN the game"

## 🔒 **Security & Validation**

### **Role-Based Access:**
- **Admins:** Can add coins via mini-games
- **Team Leaders:** Can spend coins on excavation & hints
- **Shop Owners:** Can buy barrels to increase net worth

### **Transaction Integrity:**
- All operations logged in `oil_transactions` table
- Atomic operations prevent partial updates
- RLS policies enforce role-based access
- Session isolation prevents cross-session interference

## 📊 **Analytics & Monitoring**

### **Economy Dashboard:**
- Shows coins vs net worth separation
- Tracks spending on excavation vs hints
- Monitors earnings from sales
- Validates correct implementation

### **Transaction History:**
- Complete audit trail for all operations
- Clear distinction between coin and net worth transactions
- Real-time updates across all users

---

**Remember: Coins are for playing, Net Worth is for winning!** 