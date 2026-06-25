export const mtdData = [
  { month: 'Oct 1', sent: 1200, delivered: 1150, failed: 50, cost: 24 },
  { month: 'Oct 5', sent: 1800, delivered: 1720, failed: 80, cost: 36 },
  { month: 'Oct 10', sent: 2200, delivered: 2100, failed: 100, cost: 44 },
  { month: 'Oct 15', sent: 1900, delivered: 1820, failed: 80, cost: 38 },
  { month: 'Oct 20', sent: 2800, delivered: 2700, failed: 100, cost: 56 },
  { month: 'Oct 25', sent: 3200, delivered: 3100, failed: 100, cost: 64 },
  { month: 'Oct 30', sent: 2600, delivered: 2500, failed: 100, cost: 52 },
];

export const ytdData = [
  { month: 'Jan', sent: 12000, delivered: 11400, failed: 600, cost: 240 },
  { month: 'Feb', sent: 15000, delivered: 14250, failed: 750, cost: 300 },
  { month: 'Mar', sent: 18000, delivered: 17100, failed: 900, cost: 360 },
  { month: 'Apr', sent: 22000, delivered: 20900, failed: 1100, cost: 440 },
  { month: 'May', sent: 19000, delivered: 18050, failed: 950, cost: 380 },
  { month: 'Jun', sent: 25000, delivered: 23750, failed: 1250, cost: 500 },
  { month: 'Jul', sent: 28000, delivered: 26600, failed: 1400, cost: 560 },
  { month: 'Aug', sent: 31000, delivered: 29450, failed: 1550, cost: 620 },
  { month: 'Sep', sent: 27000, delivered: 25650, failed: 1350, cost: 540 },
  { month: 'Oct', sent: 15700, delivered: 14920, failed: 780, cost: 314 },
];

export const rolling90Data = [
  { month: 'Aug 1', sent: 900, delivered: 855, failed: 45, cost: 18 },
  { month: 'Aug 8', sent: 1100, delivered: 1045, failed: 55, cost: 22 },
  { month: 'Aug 15', sent: 1400, delivered: 1330, failed: 70, cost: 28 },
  { month: 'Aug 22', sent: 1200, delivered: 1140, failed: 60, cost: 24 },
  { month: 'Sep 1', sent: 1600, delivered: 1520, failed: 80, cost: 32 },
  { month: 'Sep 8', sent: 1800, delivered: 1710, failed: 90, cost: 36 },
  { month: 'Sep 15', sent: 2100, delivered: 1995, failed: 105, cost: 42 },
  { month: 'Sep 22', sent: 1900, delivered: 1805, failed: 95, cost: 38 },
  { month: 'Oct 1', sent: 2200, delivered: 2090, failed: 110, cost: 44 },
  { month: 'Oct 8', sent: 2500, delivered: 2375, failed: 125, cost: 50 },
  { month: 'Oct 15', sent: 2800, delivered: 2660, failed: 140, cost: 56 },
  { month: 'Oct 22', sent: 3100, delivered: 2945, failed: 155, cost: 62 },
];

export const deliveryRateData = [
  { month: 'Jan', rate: 95.0 },
  { month: 'Feb', rate: 95.0 },
  { month: 'Mar', rate: 95.0 },
  { month: 'Apr', rate: 95.05 },
  { month: 'May', rate: 95.0 },
  { month: 'Jun', rate: 95.0 },
  { month: 'Jul', rate: 95.0 },
  { month: 'Aug', rate: 95.02 },
  { month: 'Sep', rate: 95.0 },
  { month: 'Oct', rate: 95.05 },
];

export const networkBreakdown = [
  { name: 'MTN Uganda', value: 45, color: '#FBBF24' },
  { name: 'Airtel Uganda', value: 35, color: '#EF4444' },
  { name: 'Africell', value: 12, color: '#8B5CF6' },
  { name: 'Smile Telecom', value: 8, color: '#06B6D4' },
];

export const recentCampaigns = [
  { id: 1, name: 'Q4 Promotions Blast', sent: 5420, delivered: 5148, rate: 94.98, status: 'completed', date: 'Oct 28, 2024', sender: 'EGOSMS' },
  { id: 2, name: 'November Newsletter', sent: 3200, delivered: 3040, rate: 95.0, status: 'completed', date: 'Oct 25, 2024', sender: 'EGOSMS' },
  { id: 3, name: 'Flash Sale Alert', sent: 8900, delivered: 8455, rate: 95.0, status: 'completed', date: 'Oct 22, 2024', sender: 'FLASH' },
  { id: 4, name: 'Appointment Reminders', sent: 1200, delivered: 1140, rate: 95.0, status: 'running', date: 'Oct 30, 2024', sender: 'CLINIC' },
  { id: 5, name: 'Weekend Deals', sent: 4500, delivered: 0, rate: 0, status: 'scheduled', date: 'Nov 2, 2024', sender: 'DEALS' },
];

export const contacts = [
  { id: 1, name: 'John Mukasa', phone: '+256701234567', group: 'VIP Customers', added: 'Oct 28', network: 'MTN' },
  { id: 2, name: 'Sarah Namukasa', phone: '+256782345678', group: 'Newsletter', added: 'Oct 26', network: 'Airtel' },
  { id: 3, name: 'Peter Ssemakula', phone: '+256753456789', group: 'Staff', added: 'Oct 24', network: 'MTN' },
  { id: 4, name: 'Grace Nalwoga', phone: '+256774567890', group: 'VIP Customers', added: 'Oct 22', network: 'Africell' },
  { id: 5, name: 'David Kiggundu', phone: '+256785678901', group: 'Newsletter', added: 'Oct 20', network: 'MTN' },
  { id: 6, name: 'Amina Nakalema', phone: '+256756789012', group: 'Partners', added: 'Oct 18', network: 'Airtel' },
];

export const aiInsights = [
  {
    type: 'anomaly',
    title: 'Delivery Rate Spike Detected',
    message: 'MTN Uganda delivery rates improved by 2.3% on Oct 26th. Consider scheduling campaigns on Thursdays for better reach.',
    action: 'View Analysis',
    severity: 'info',
  },
  {
    type: 'recommendation',
    title: 'Optimal Send Time',
    message: 'AI analysis shows your audience engages 34% more between 10AM–12PM EAT. Next campaign scheduled at 9AM may underperform.',
    action: 'Reschedule',
    severity: 'warning',
  },
  {
    type: 'growth',
    title: 'Contact List Growth Opportunity',
    message: 'You have 1,240 contacts who haven\'t received an SMS in 30+ days. A re-engagement campaign could recover 65% of them.',
    action: 'Launch Campaign',
    severity: 'success',
  },
];

export const chatFAQs = [
  { q: 'check balance', a: '💳 Your current SMS credit balance is **UGX 245,000** (~4,900 SMS). Last top-up: Oct 20, 2024 (UGX 100,000). [Top Up Now →]' },
  { q: 'how to send bulk sms', a: '📤 To send Bulk SMS:\n1. Click **"Send SMS"** in the sidebar\n2. Select **"Bulk SMS"**\n3. Upload your contact list or select a group\n4. Type your message (160 chars = 1 credit)\n5. Click **"Send Now"** or **"Schedule"**\n\nNeed help composing? I can draft a message for you!' },
  { q: 'delivery rate', a: '📊 Your current delivery rate is **95.05%** — well above the industry average of 91%. This means 95 out of every 100 messages are successfully delivered to recipients.' },
  { q: 'add contacts', a: '👥 To add contacts:\n- **Manual**: Go to Contacts → Add Contact\n- **CSV Upload**: Contacts → Import → Upload CSV\n- **API**: Use our REST API at developers.pahappa.com\n\nShall I open the Add Contact form for you?' },
  { q: 'top up', a: '💰 Top-up options:\n- **Mobile Money**: MTN/Airtel Money\n- **Bank Transfer**: Stanbic, DFCU, Centenary\n- **Credit/Debit Card**: Visa & Mastercard\n\nMinimum top-up: UGX 10,000 = ~200 SMS credits\n[Go to Billing →]' },
  { q: 'schedule sms', a: '⏰ To schedule an SMS:\n1. Go to Send SMS → Bulk SMS\n2. Fill in your message and recipients\n3. Toggle **"Schedule Message"**\n4. Choose date, time & timezone (EAT recommended)\n5. Click **"Confirm Schedule"**\n\nYou can schedule up to 1 year in advance!' },
];
