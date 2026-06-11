import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { API_BASE, superadminFetch, clearSuperadminToken } from '../lib/api';
import WavitLogo from '../components/WavitLogo';

interface Registration { id: string; business_name: string; owner_name: string; email: string; phone: string; category: string; zip_code: string | null; num_staff: number; avg_service_minutes: number; message: string | null; status: 'pending'|'approved'|'rejected'; submitted_at: number; reviewed_at: number | null; admin_note: string | null; }
interface Shop { id: string; name: string; category: string; zip_code: string | null; num_staff: number; avg_service_minutes: number; queue_open: boolean; allow_remote_join: boolean; opening_time: string; closing_time: string; created_at: number; email: string | null; analytics_email: string | null; analytics_enabled: boolean; last_analytics_sent: number | null; }
interface ShopEdit { name: string; email: string; category: string; numStaff: string; avgServiceMinutes: string; queueOpen: boolean; allowRemoteJoin: boolean; openingTime: string; closingTime: string; adminPin: string; }

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

interface AboutContent { mission_body: string; mission_quote: string; cta_tagline: string; features: { title: string; desc: string }[]; }
interface HowToUseContent { customer_steps: { title: string; desc: string }[]; customer_faqs: { q: string; a: string }[]; business_steps: { title: string; desc: string }[]; business_faqs: { q: string; a: string }[]; }
interface TermsContent { last_updated: string; body: string; }
interface PrivacyContent { last_updated: string; body: string; }
interface WebDevContent { body: string; }
interface ForClinicsContent { body: string; }
interface HistoryTicket { id: string; name: string; phone: string; joined_at: number|string; exited_at: number|string|null; served_at: number|string|null; party_size: number|null; shop_id: string; shop_name: string; shop_category: string; }
interface HomeContent { hero_badge: string; hero_headline: string; hero_subtext: string; hero_btn1: string; hero_btn2: string; hero_btn3: string; live_title: string; live_subtitle: string; live_cta: string; how_title: string; how_subtitle: string; how_steps: { title: string; desc: string }[]; biz_badge: string; biz_headline: string; biz_body: string; biz_btn: string; biz_features: { title: string; desc: string }[]; clinic_badge: string; clinic_headline: string; clinic_body: string; clinic_btn: string; clinic_features: { title: string; desc: string }[]; }

const DEFAULT_HOME: HomeContent = {hero_badge:'Live Queue Updates Active',hero_headline:'Never Wait\nBlindly.',hero_subtext:"Real-time queues for the places you love. See your spot, track your wait, and show up exactly when you're needed.",hero_btn1:'View Live Shops',hero_btn2:'Join a Queue',hero_btn3:'For Businesses',live_title:'Live Right Now',live_subtitle:"See what's happening at shops near you",live_cta:'View All Shops',how_title:'How It Works',how_subtitle:"Skip the physical wait. Claim your spot from anywhere and show up exactly when you're up.",how_steps:[{title:'Scan or Search',desc:'Find your shop via QR code or search by name in our directory.'},{title:'Watch Your Wait',desc:'See your live position and estimated wait time updated in real-time.'},{title:'Get Texted',desc:'Receive an SMS the moment your turn is approaching. No app required.'}],biz_badge:'For Businesses',biz_headline:'Built for Modern Businesses',biz_body:'Transform your waiting area. Give your customers their time back while keeping your chairs full and your staff efficient.',biz_btn:'Apply to Join Wavit',biz_features:[{title:'Live Queue Management',desc:"Easily manage who's next and see incoming customers in real-time from your dashboard."},{title:'Auto SMS Notifications',desc:'Customers get automated text updates as their turn approaches — no app needed.'},{title:'Real-time Analytics',desc:'Track wait times, customer flow, and staff efficiency with detailed reporting.'}],clinic_badge:'For Clinics',clinic_headline:'Built for Modern Clinics',clinic_body:'Streamline patient flow with minimal friction. No phone numbers, no downloads — just a name and a live queue that keeps everyone informed.',clinic_btn:'Apply to Join Wavit',clinic_features:[{title:'Patient Transparency',desc:'Patients see their live place in line and know exactly when to be ready — no crowded waiting rooms.'},{title:'Smooth Admin Experience',desc:'One-tap check-ins, instant queue updates, and zero paperwork. Your front desk stays focused on care.'},{title:'Web Integration',desc:'Everything runs in the browser. Patients scan, join, and track from any device without installing a thing.'}]};
const DEFAULT_ABOUT: AboutContent = { mission_body:"Waiting rooms are outdated. Barbershops, salons, and local businesses lose customers to frustration every day. We built Wavit so you can see your exact wait time right from your phone — no guessing, no crowding the waiting area.", mission_quote:"Eliminate unnecessary waiting — for customers who value their time and businesses who want happier clients.", cta_tagline:"Find a shop near you and join their queue in under 30 seconds.", features:[{title:"See Your Wait Time From Your Phone",desc:"Check your live position and exact wait time right on your phone — updated every few seconds, no app needed."},{title:"Scan QR Code to Join Queue",desc:"Simply scan the QR code at your shop to instantly join the queue — no account, no download required."},{title:"Smart Auto-Remove",desc:"If you leave or no longer need your spot, the system auto-removes you to keep the queue moving for everyone."}]};
const DEFAULT_HOW_TO_USE: HowToUseContent = { customer_steps:[{title:"Find Your Shop",desc:"Scan the QR code posted at the shop entrance, or go to the Wavit website and search for the business by name."},{title:"Check In to the Queue",desc:"Enter your name and phone number to join the queue. You'll receive a link to your live queue status."},{title:"See Your Wait Time From Your Phone",desc:"Your queue page shows your live position and exact estimated wait time — updated every few seconds, right on your phone screen."}], customer_faqs:[{q:"Do I need to download an app?",a:"No. Everything works in your phone's web browser. Just scan the QR code or visit the site."},{q:"How do I check my wait time?",a:"After checking in, you'll get a link to your personal queue page. Open it on your phone to see your live wait time updated in real time."},{q:"What if I miss my turn?",a:"If you're removed from the queue, simply scan the QR code or search for the shop again to re-join."}], business_steps:[{title:"Apply to Join Wavit",desc:"Go to the Register page and fill out your business details. Once approved, you'll receive your unique admin link."},{title:"Log In With Your PIN",desc:"Use the Login page and enter your 6-digit business PIN to access your admin dashboard. Keep this PIN safe — it's how you manage your queue."},{title:"Open Your Queue",desc:"In the admin panel, toggle your queue open. Customers can now check in via your QR code or by searching your business on the site."},{title:"Serve Customers",desc:'When you\'re ready for the next person, tap "Serve Next" in your admin panel. Wavit automatically texts the next customer that their turn is coming up.'}], business_faqs:[{q:"How do I log in to my admin panel?",a:"Go to the Login page and enter your 6-digit business PIN. You'll be redirected straight to your dashboard."},{q:"What if I forget my PIN?",a:"Contact us at wavitapp@gmail.com and we can reset it for you."},{q:"Can I change my settings after setup?",a:"Yes. Inside the admin panel you can update your hours, staff count, service time, PIN, and more at any time."},{q:"How do customers get notified?",a:'Wavit sends SMS texts automatically. When you tap "Serve Next," the customer receives a text that their turn is approaching.'}]};
const DEFAULT_TERMS: TermsContent = { last_updated:"April 2025", body:`1. Acceptance of Terms\nBy accessing or using Wavit ("the Service," "we," "us"), you agree to be bound by these Terms of Service. If you do not agree, please do not use Wavit.\n\n2. Description of Service\nWavit is a digital queue management platform that lets local businesses manage wait lines and allows their customers to join virtual queues and receive status updates via SMS.\n\n3. SMS Notifications & Consent\nBy joining a queue, you consent to receive SMS text messages from Wavit regarding your queue position and status at the business you joined. Message frequency varies. Message and data rates may apply.\n\nReply STOP to opt out. Reply HELP for help or email wavitapp@gmail.com.\n\n4. Business Accounts\nBusinesses must provide accurate information. Wavit reserves the right to approve, reject, or suspend any account at our sole discretion.\n\n5. Acceptable Use\nYou agree not to misuse the Service — including joining queues with false information or attempting to disrupt the platform.\n\n6. Limitation of Liability\nWavit is provided "as is." We do not guarantee uninterrupted service or the accuracy of wait times. To the maximum extent permitted by law, Wavit shall not be liable for any indirect, incidental, or consequential damages.\n\n7. Privacy\nYour use of the Service is also governed by our Privacy Policy.\n\n8. Changes to Terms\nWe may update these Terms from time to time. Continued use constitutes acceptance.\n\n9. Contact\nEmail us at wavitapp@gmail.com.`};
const DEFAULT_PRIVACY: PrivacyContent = { last_updated:"April 2025", body:`1. Information We Collect\nWhen you join a queue, we collect your name and phone number solely to send queue status notifications. When a business registers, we collect the owner's name, business name, email, phone, and basic business details.\n\n2. How We Use Your Information\n- To send SMS notifications about your place in a queue.\n- To communicate with business owners about their Wavit account.\n- To send optional analytics summary emails to registered businesses.\n- To improve and operate the Wavit platform.\n\nWe do not sell, rent, or share your personal information with third parties for marketing purposes.\n\n3. SMS & Email Communications\nBy providing your phone number to join a queue, you consent to receive SMS texts from Wavit. Reply STOP to permanently opt out.\n\n4. Data Retention\nQueue records are used only during the active queue session and are not retained long-term for marketing purposes.\n\n5. Third-Party Services\n- Twilio — for SMS delivery.\n- Resend — for transactional emails to business owners.\n- Replit / PostgreSQL — for hosting and database storage.\n\n6. Cookies\nWavit does not currently use tracking cookies or third-party analytics.\n\n7. Children's Privacy\nThe Service is not directed to children under 13.\n\n8. Your Rights\nYou may request deletion of your personal information at any time by contacting us.\n\n9. Changes to This Policy\nWe may update this Privacy Policy periodically.\n\n10. Contact\nPrivacy questions: wavitapp@gmail.com`};
const DEFAULT_FOR_CLINICS: ForClinicsContent = { body:"Clinics on Wavit only need your first name to hold your spot in line. No phone number required.\n\nScan the QR code at the front desk to instantly join the queue — no app download needed.\n\nVisit www.wavit.cc or open the Wavit app to see how many people are ahead of you in real time.\n\nWait wherever you like. The queue updates live so you always know your place. There's no need to sit in the waiting room.\n\nFrequently Asked Questions:\n\nDo I need to download an app?\nNo. Everything works in your phone's web browser. The QR code takes you directly to the clinic's queue.\n\nDo I need to give my phone number?\nNo. Clinics on Wavit only collect your first name to hold your spot in line. No phone number required.\n\nHow do I know my place in line?\nAfter joining, check www.wavit.cc or the Wavit app to see live queue lengths for the clinic.\n\nWhat happens when it's my turn?\nThe clinic will call your name. Your spot is automatically removed from the queue when you go in.\n\nCan I leave and come back?\nYes. The queue is live online so you can check your place anytime. Just make sure to be back before your name is called." };
const CATEGORIES = ['Barbershop','Salon','Nail Salon','Spa','Clinic','Tattoo','Other'];

function fmtTime(ts: number|string) { return new Date(Number(ts)).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }
function fmtDate(ts: number|string) { return new Date(Number(ts)).toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'}); }

/* ── Design tokens ── */
const BG     = '#070b14';
const GLASS  = 'rgba(255,255,255,0.04)';
const GLASSH = 'rgba(255,255,255,0.07)';
const BORDER = 'rgba(255,255,255,0.08)';
const BORDERL= 'rgba(255,255,255,0.12)';
const TEXT   = '#f0f4ff';
const TEXTSUB= 'rgba(148,163,184,0.7)';
const TEXTMID= 'rgba(203,213,225,0.85)';

function Blobs() {
  return (
    <>
      <div style={{position:'fixed',top:'-8%',left:'-8%',width:'55vw',height:'55vw',borderRadius:'50%',background:'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',filter:'blur(80px)',pointerEvents:'none',zIndex:0}} />
      <div style={{position:'fixed',top:'25%',right:'-18%',width:'50vw',height:'50vw',borderRadius:'50%',background:'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',filter:'blur(90px)',pointerEvents:'none',zIndex:0}} />
      <div style={{position:'fixed',bottom:'-12%',left:'20%',width:'45vw',height:'45vw',borderRadius:'50%',background:'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',filter:'blur(85px)',pointerEvents:'none',zIndex:0}} />
    </>
  );
}

function DarkCard({children,style={}}:{children:React.ReactNode;style?:React.CSSProperties}) {
  return <div style={{background:GLASS,border:`1px solid ${BORDER}`,borderRadius:'18px',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',...style}}>{children}</div>;
}

function DarkInput({style={},...props}:React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{width:'100%',padding:'10px 13px',background:'rgba(255,255,255,0.06)',border:`1px solid ${BORDERL}`,borderRadius:'10px',color:TEXT,fontSize:'13px',outline:'none',fontFamily:"'Inter',sans-serif",boxSizing:'border-box' as any,...style}} />;
}

function DarkTextarea({style={},...props}:React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{width:'100%',padding:'10px 13px',background:'rgba(255,255,255,0.06)',border:`1px solid ${BORDERL}`,borderRadius:'10px',color:TEXT,fontSize:'13px',outline:'none',fontFamily:"'Inter',sans-serif",boxSizing:'border-box' as any,resize:'vertical' as any,...style}} />;
}

function PrimaryBtn({children,disabled,onClick,style={},type='button'}:{children:React.ReactNode;disabled?:boolean;onClick?:()=>void;style?:React.CSSProperties;type?:'button'|'submit'}) {
  return <button type={type} disabled={disabled} onClick={onClick} style={{padding:'10px 18px',background:disabled?'rgba(59,130,246,0.3)':'linear-gradient(135deg,#3b82f6,#8b5cf6)',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:700,cursor:disabled?'not-allowed':'pointer',fontFamily:"'Inter',sans-serif",transition:'all 0.2s',boxShadow:disabled?'none':'0 0 16px rgba(59,130,246,0.3)',opacity:disabled?0.6:1,...style}}>{children}</button>;
}

function Tab({active,onClick,children,badge}:{active:boolean;onClick:()=>void;children:React.ReactNode;badge?:number|string}) {
  return (
    <button onClick={onClick} style={{padding:'9px 16px',borderRadius:'12px',border:`1px solid ${active?'rgba(59,130,246,0.4)':BORDER}`,background:active?'linear-gradient(135deg,rgba(59,130,246,0.25),rgba(139,92,246,0.2))':GLASS,color:active?TEXT:TEXTSUB,fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'all 0.2s',display:'flex',alignItems:'center',gap:'6px',whiteSpace:'nowrap' as any,boxShadow:active?'0 0 16px rgba(59,130,246,0.2)':'none'}}>
      {children}
      {badge !== undefined && <span style={{fontSize:'11px',padding:'2px 7px',borderRadius:'8px',background:active?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.08)',fontWeight:800}}>{badge}</span>}
    </button>
  );
}

const STATUS_STYLE: Record<string,{bg:string;border:string;color:string}> = {
  pending:  {bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.25)', color:'#fbbf24'},
  approved: {bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.25)', color:'#34d399'},
  rejected: {bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.2)',   color:'#f87171'},
};

function downloadWavitLogo() {
  const W = 800, H = 260;
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="dl-bg" x1="0" y1="0" x2="140" y2="140" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#0d1428"/>
        <stop offset="100%" stop-color="#160b38"/>
      </linearGradient>
      <linearGradient id="dl-w" x1="6" y1="28" x2="50" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#22d3ee"/>
        <stop offset="48%" stop-color="#6366f1"/>
        <stop offset="100%" stop-color="#a78bfa"/>
      </linearGradient>
      <linearGradient id="dl-border" x1="0" y1="0" x2="140" y2="140" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="rgba(99,147,255,0.35)"/>
        <stop offset="100%" stop-color="rgba(167,139,250,0.2)"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="#070b14"/>
    <g transform="translate(${Math.round((W - 520) / 2)}, ${Math.round((H - 140) / 2)})">
      <g transform="scale(2.5)">
        <rect x="0.5" y="0.5" width="55" height="55" rx="13.5" fill="url(#dl-bg)"/>
        <rect x="0.5" y="0.5" width="55" height="55" rx="13.5" stroke="url(#dl-border)" stroke-width="1" fill="none"/>
        <rect x="8" y="1.5" width="40" height="1" rx="0.5" fill="rgba(255,255,255,0.1)"/>
        <path d="M 6 11 C 8 11, 14 43, 19 45 C 24 47, 24.5 20, 28 15 C 31.5 10, 32 47, 37 45 C 42 43, 48 11, 50 11"
          stroke="url(#dl-w)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
      <text x="162" y="107" font-family="system-ui, sans-serif" font-size="82" font-weight="700" letter-spacing="-3" fill="#a5c4ff">wavit</text>
    </g>
  </svg>`;
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = W * 2;
    canvas.height = H * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0, W, H);
    canvas.toBlob(pngBlob => {
      if (!pngBlob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(pngBlob);
      a.download = 'wavit-logo.png';
      a.click();
    }, 'image/png');
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

export default function SuperAdminPage() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]|null>(null);
  const [shops, setShops] = useState<Shop[]|null>(null);
  const [history, setHistory] = useState<HistoryTicket[]|null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all'|'pending'|'approved'|'rejected'>('pending');
  const [mainTab, setMainTab] = useState<'registrations'|'shops'|'history'|'edit'>('registrations');
  const [actionId, setActionId] = useState<string|null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectTarget, setRejectTarget] = useState<string|null>(null);
  const [editingShop, setEditingShop] = useState<string|null>(null);
  const [shopEdit, setShopEdit] = useState<ShopEdit|null>(null);
  const [shopSaving, setShopSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null);
  const [tutorialSending, setTutorialSending] = useState<Record<string,'sending'|'sent'|'error'>>({});
  const [qrDownloadShop, setQrDownloadShop] = useState<Shop|null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement|null>(null);
  const [analyticsToggling, setAnalyticsToggling] = useState<Record<string,boolean>>({});
  const [editPage, setEditPage] = useState<'home'|'about'|'how_to_use'|'terms'|'privacy'|'web_dev'|'for_clinics'>('home');
  const [homeDraft, setHomeDraft] = useState<HomeContent>(DEFAULT_HOME);
  const [aboutDraft, setAboutDraft] = useState<AboutContent>(DEFAULT_ABOUT);
  const [howToUseDraft, setHowToUseDraft] = useState<HowToUseContent>(DEFAULT_HOW_TO_USE);
  const [termsDraft, setTermsDraft] = useState<TermsContent>(DEFAULT_TERMS);
  const [privacyDraft, setPrivacyDraft] = useState<PrivacyContent>(DEFAULT_PRIVACY);
  const [webDevDraft, setWebDevDraft] = useState<WebDevContent>({ body: '' });
  const [forClinicsDraft, setForClinicsDraft] = useState<ForClinicsContent>(DEFAULT_FOR_CLINICS);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [contentSaved, setContentSaved] = useState<string|null>(null);

  const fetchRegistrations = useCallback(async () => {
    try {
      const res = await superadminFetch(`${API_BASE}/superadmin/registrations`);
      if (res.status===401||res.status===403){navigate('/superadmin-login');return;}
      const data = await res.json();
      if (!res.ok){setError(data.error||'Failed to load');return;}
      setRegistrations(data);
    } catch {setError('Network error');}
  },[navigate]);

  const fetchShops = useCallback(async () => {
    try {const res=await superadminFetch(`${API_BASE}/superadmin/shops`);if(!res.ok)return;setShops(await res.json());}catch{}
  },[]);

  const fetchHistory = useCallback(async () => {
    try {const res=await superadminFetch(`${API_BASE}/superadmin/history`);if(!res.ok)return;setHistory(await res.json());}catch{}
  },[]);

  useEffect(()=>{fetchRegistrations();fetchShops();const iv=setInterval(()=>{fetchRegistrations();fetchShops();},15000);return()=>clearInterval(iv);},[fetchRegistrations,fetchShops]);
  useEffect(()=>{if(mainTab==='history')fetchHistory();},[mainTab,fetchHistory]);
  useEffect(()=>{
    if(mainTab!=='edit')return;
    setContentLoading(true);
    Promise.all([
      superadminFetch(`${API_BASE}/content/home`).then(r=>r.ok?r.json():null),
      superadminFetch(`${API_BASE}/content/about`).then(r=>r.ok?r.json():null),
      superadminFetch(`${API_BASE}/content/how_to_use`).then(r=>r.ok?r.json():null),
      superadminFetch(`${API_BASE}/content/terms`).then(r=>r.ok?r.json():null),
      superadminFetch(`${API_BASE}/content/privacy`).then(r=>r.ok?r.json():null),
      superadminFetch(`${API_BASE}/content/web_dev`).then(r=>r.ok?r.json():null),
      superadminFetch(`${API_BASE}/content/for_clinics`).then(r=>r.ok?r.json():null),
    ]).then(([home,about,htu,terms,privacy,webDev,forClinics])=>{
      if(home)setHomeDraft({...DEFAULT_HOME,...home});if(about)setAboutDraft(about);if(htu)setHowToUseDraft(htu);if(terms)setTermsDraft(terms);if(privacy)setPrivacyDraft(privacy);if(webDev)setWebDevDraft(webDev);if(forClinics)setForClinicsDraft(forClinics);
    }).catch(()=>{}).finally(()=>setContentLoading(false));
  },[mainTab]);

  useEffect(()=>{
    if(!qrDownloadShop) return;
    const timer = setTimeout(()=>{
      const qrCanvas = document.getElementById('sa-qr-canvas') as HTMLCanvasElement;
      if(!qrCanvas) { setQrDownloadShop(null); return; }
      const W = 1275, H = 1650;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      if(!ctx) { setQrDownloadShop(null); return; }
      function rr(x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
      ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,W,H);
      const dark='#111827', indigo='#4f46e5', gray='#4b5563';
      // Margins: 0.25in (38px) left/right, 0.5in (75px) top/bottom at 150dpi
      // Content lives within x=[38, 1237], y=[75, 1575]
      const marginX=38, marginTop=75, contentW=W-marginX*2; // 1199px ≈ 8.0in
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      let y=marginTop;

      const drawWide=(text:string,desiredScale:number)=>{
        ctx.save();
        (ctx as any).letterSpacing='-5px';
        const natural=ctx.measureText(text).width;
        const scaleX=Math.min(desiredScale,contentW/natural);
        ctx.scale(scaleX,1);
        const cx=W/(2*scaleX);
        ctx.lineJoin='round'; ctx.lineWidth=8;
        ctx.strokeStyle=ctx.fillStyle as string;
        ctx.strokeText(text,cx,y); ctx.fillText(text,cx,y);
        (ctx as any).letterSpacing='0px';
        ctx.restore();
      };

      // "JOIN"
      ctx.fillStyle=dark; ctx.font='bold 140px Arial, sans-serif';
      y+=140; drawWide('JOIN',1.18); y+=12;

      // "[SHOP NAME]'S" — auto-size to stay within content width
      const shopLabel=(qrDownloadShop.name.toUpperCase()+"'S");
      let nameSz=118;
      (ctx as any).letterSpacing='-5px';
      ctx.font=`bold ${nameSz}px Arial, sans-serif`;
      while(ctx.measureText(shopLabel).width>contentW&&nameSz>48){nameSz-=4;ctx.font=`bold ${nameSz}px Arial, sans-serif`;}
      (ctx as any).letterSpacing='0px';
      ctx.fillStyle=indigo; y+=nameSz; drawWide(shopLabel,1.18); y+=12;

      // "WAITLIST HERE"
      ctx.fillStyle=dark; ctx.font='bold 140px Arial, sans-serif';
      y+=140; drawWide('WAITLIST HERE',1.18); y+=20;

      // Big downward arrow
      const ax=W/2, aShaftW=220, aHeadW=420, aShaftH=75, aHeadH=92;
      ctx.fillStyle=dark;
      ctx.beginPath();
      ctx.moveTo(ax-aShaftW/2,y); ctx.lineTo(ax+aShaftW/2,y);
      ctx.lineTo(ax+aShaftW/2,y+aShaftH); ctx.lineTo(ax+aHeadW/2,y+aShaftH);
      ctx.lineTo(ax,y+aShaftH+aHeadH); ctx.lineTo(ax-aHeadW/2,y+aShaftH);
      ctx.lineTo(ax-aShaftW/2,y+aShaftH); ctx.closePath(); ctx.fill();
      y+=aShaftH+aHeadH+16;

      // QR code
      const qrSize=620, pad=22, boxW=qrSize+pad*2, boxX=(W-boxW)/2;
      ctx.fillStyle='#ffffff'; rr(boxX,y,boxW,boxW,26); ctx.fill();
      ctx.strokeStyle='#c7d2fe'; ctx.lineWidth=6; rr(boxX,y,boxW,boxW,26); ctx.stroke();
      ctx.drawImage(qrCanvas,boxX+pad,y+pad,qrSize,qrSize);
      y+=boxW+18;

      // "Track your live position and est wait time for"
      ctx.fillStyle=gray; ctx.font='40px Arial, sans-serif';
      y+=40; ctx.fillText('Track your live position and est wait time for',W/2,y); y+=8;

      // Shop name
      ctx.fillStyle=indigo; ctx.font='bold 46px Arial, sans-serif';
      y+=46; ctx.fillText(qrDownloadShop.name,W/2,y); y+=10;

      // Bold tagline — wrapped within content width
      const bottomLine=`Use www.wavit.cc or the Wavit app to see ${qrDownloadShop.name}'s live wait times at any moment from your phone.`;
      ctx.fillStyle=dark; ctx.font='bold 36px Arial, sans-serif';
      const maxLineW=contentW-60;
      const bWords=bottomLine.split(' ');
      let curLine=''; const bLines:string[]=[];
      for(const w of bWords){
        const test=curLine?curLine+' '+w:w;
        if(ctx.measureText(test).width>maxLineW&&curLine){bLines.push(curLine);curLine=w;}
        else{curLine=test;}
      }
      if(curLine)bLines.push(curLine);
      for(const bl of bLines){y+=38;ctx.fillText(bl,W/2,y);}

      // Footer bar at bottom margin line
      ctx.fillStyle=indigo; ctx.fillRect(marginX,H-marginTop,contentW,8);
      const url=c.toDataURL('image/png');
      const a=document.createElement('a'); a.href=url;
      a.download=`${qrDownloadShop.name.replace(/\s+/g,'-').toLowerCase()}-qr-flyer.png`;
      a.click();
      setQrDownloadShop(null);
    }, 80);
    return ()=>clearTimeout(timer);
  },[qrDownloadShop]);

  const saveContent = async (page:string,data:unknown) => {
    setContentSaving(true);
    try {
      const res=await superadminFetch(`${API_BASE}/superadmin/content/${page}`,{method:'PUT',body:JSON.stringify(data)});
      if(!res.ok)throw new Error('Save failed');
      setContentSaved(page);setTimeout(()=>setContentSaved(null),2500);
    } catch(err:any){alert('Save failed: '+err.message);}
    finally{setContentSaving(false);}
  };

  const logout = async () => {
    await superadminFetch(`${API_BASE}/superadmin/logout`,{method:'POST'});
    clearSuperadminToken();
    navigate('/superadmin-login');
  };

  const handleApprove = async (id:string) => {
    setActionId(id);
    try {const res=await superadminFetch(`${API_BASE}/superadmin/registrations/${id}/approve`,{method:'POST'});const data=await res.json();if(!res.ok)throw new Error(data.error);await fetchRegistrations();await fetchShops();}
    catch(err:any){alert('Approve failed: '+err.message);}
    finally{setActionId(null);}
  };

  const handleReject = async (id:string) => {
    setActionId(id);
    try {const res=await superadminFetch(`${API_BASE}/superadmin/registrations/${id}/reject`,{method:'POST',body:JSON.stringify({note:rejectNote})});const data=await res.json();if(!res.ok)throw new Error(data.error);setRejectTarget(null);setRejectNote('');await fetchRegistrations();}
    catch(err:any){alert('Reject failed: '+err.message);}
    finally{setActionId(null);}
  };

  const startEditShop = (shop:Shop) => {
    setEditingShop(shop.id);
    setShopEdit({name:shop.name,email:shop.email||'',category:shop.category,numStaff:String(shop.num_staff),avgServiceMinutes:String(shop.avg_service_minutes),queueOpen:shop.queue_open,allowRemoteJoin:shop.allow_remote_join,openingTime:shop.opening_time||'09:00',closingTime:shop.closing_time||'18:00',adminPin:''});
  };

  const saveShop = async (shopId:string) => {
    if(!shopEdit)return;setShopSaving(true);
    try {
      const res=await superadminFetch(`${API_BASE}/superadmin/shops/${shopId}`,{method:'PATCH',body:JSON.stringify({name:shopEdit.name,email:shopEdit.email,category:shopEdit.category,numStaff:shopEdit.numStaff,avgServiceMinutes:shopEdit.avgServiceMinutes,queueOpen:shopEdit.queueOpen,allowRemoteJoin:shopEdit.allowRemoteJoin,openingTime:shopEdit.openingTime,closingTime:shopEdit.closingTime,...(shopEdit.adminPin?{adminPin:shopEdit.adminPin}:{})})});
      if(!res.ok)throw new Error('Save failed');setEditingShop(null);setShopEdit(null);await fetchShops();
    } catch(err:any){alert('Save failed: '+err.message);}
    finally{setShopSaving(false);}
  };

  const deleteShop = async (shopId:string) => {
    setActionId(shopId+'-delete');
    try {const res=await superadminFetch(`${API_BASE}/superadmin/shops/${shopId}`,{method:'DELETE'});if(!res.ok)throw new Error('Delete failed');setDeleteConfirm(null);await fetchShops();}
    catch(err:any){alert('Delete failed: '+err.message);}
    finally{setActionId(null);}
  };

  const toggleShopAnalytics = async (shopId:string, enabled:boolean) => {
    setAnalyticsToggling(s=>({...s,[shopId]:true}));
    try {
      const res=await superadminFetch(`${API_BASE}/superadmin/shops/${shopId}/analytics`,{method:'PATCH',body:JSON.stringify({enabled})});
      if(!res.ok)throw new Error('Failed');
      await fetchShops();
    } catch(err:any){alert('Could not update analytics: '+err.message);}
    finally{setAnalyticsToggling(s=>{const n={...s};delete n[shopId];return n;});}
  };

  const sendTutorial = async (shopId:string) => {
    setTutorialSending(s=>({...s,[shopId]:'sending'}));
    try {const res=await superadminFetch(`${API_BASE}/superadmin/shops/${shopId}/send-tutorial`,{method:'POST'});const data=await res.json();if(!res.ok)throw new Error(data.error||'Failed');setTutorialSending(s=>({...s,[shopId]:'sent'}));setTimeout(()=>setTutorialSending(s=>{const n={...s};delete n[shopId];return n;}),3000);}
    catch(err:any){alert('Could not send tutorial: '+err.message);setTutorialSending(s=>{const n={...s};delete n[shopId];return n;});}
  };

  if (error) {
    return (
      <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',position:'relative'}}>
        <Blobs />
        <div style={{textAlign:'center',background:GLASS,border:`1px solid ${BORDER}`,borderRadius:'24px',padding:'40px',maxWidth:'340px',width:'100%',backdropFilter:'blur(20px)',position:'relative',zIndex:1}}>
          <div style={{fontSize:'40px',marginBottom:'16px'}}>🔒</div>
          <h2 style={{fontSize:'18px',fontWeight:800,color:TEXT,marginBottom:'8px'}}>Access Denied</h2>
          <p style={{fontSize:'13px',color:'#f87171',marginBottom:'20px'}}>{error}</p>
          <Link to="/" style={{color:'#60a5fa',fontWeight:700,fontSize:'14px',textDecoration:'none'}}>← Back to home</Link>
        </div>
      </div>
    );
  }

  if (!registrations) {
    return (
      <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
        <Blobs />
        <div style={{position:'relative',width:'40px',height:'40px',zIndex:1}}>
          <div style={{position:'absolute',inset:0,borderRadius:'50%',border:'2px solid rgba(59,130,246,0.2)'}} />
          <div style={{position:'absolute',inset:0,borderRadius:'50%',border:'2px solid transparent',borderTopColor:'#3b82f6',borderRightColor:'#8b5cf6',animation:'spin 0.9s linear infinite'}} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  const filtered = registrations.filter(r=>filter==='all'||r.status===filter);
  const counts = {all:registrations.length,pending:registrations.filter(r=>r.status==='pending').length,approved:registrations.filter(r=>r.status==='approved').length,rejected:registrations.filter(r=>r.status==='rejected').length};

  return (
    <div style={{minHeight:'100vh',background:BG,color:TEXT,fontFamily:"'Inter',system-ui,sans-serif",position:'relative'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Blobs />

      {/* Header */}
      <div style={{position:'relative',zIndex:2,background:'linear-gradient(135deg, rgba(15,23,60,0.95), rgba(30,20,80,0.92))',borderBottom:`1px solid rgba(255,255,255,0.1)`,backdropFilter:'blur(20px)'}}>
        <div style={{maxWidth:'900px',margin:'0 auto',padding:'18px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'6px'}}>
              <WavitLogo size="sm" asDiv />
            </div>
            <h1 style={{fontSize:'20px',fontWeight:900,color:TEXT,letterSpacing:'-0.02em',marginBottom:'2px'}}>Super Admin</h1>
            <p style={{fontSize:'12px',color:'rgba(167,139,250,0.7)',fontWeight:500}}>{counts.pending} pending · {shops?.length??0} live shops</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <Link to="/" style={{fontSize:'12px',color:'rgba(167,139,250,0.7)',textDecoration:'none',fontWeight:600}}>← Public site</Link>
            <button onClick={downloadWavitLogo} title="Download Wavit logo as PNG" style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:'rgba(255,255,255,0.07)',border:`1px solid ${BORDER}`,borderRadius:'10px',color:TEXTSUB,fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"/></svg>
              Logo PNG
            </button>
            <button onClick={logout} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:'rgba(255,255,255,0.07)',border:`1px solid ${BORDER}`,borderRadius:'10px',color:TEXTSUB,fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:'900px',margin:'0 auto',padding:'16px 16px 40px',position:'relative',zIndex:1}}>
        {/* Main tabs */}
        <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap' as any}}>
          <Tab active={mainTab==='registrations'} onClick={()=>setMainTab('registrations')} badge={counts.pending>0?counts.pending:undefined}>
            Registrations
          </Tab>
          <Tab active={mainTab==='shops'} onClick={()=>setMainTab('shops')} badge={shops?.length??'…'}>
            Live Shops
          </Tab>
          <Tab active={mainTab==='history'} onClick={()=>setMainTab('history')}>History</Tab>
          <Tab active={mainTab==='edit'} onClick={()=>setMainTab('edit')}>Edit Pages</Tab>
        </div>

        {/* ── Registrations Tab ── */}
        {mainTab==='registrations' && (
          <>
            <div style={{display:'flex',gap:'6px',marginBottom:'14px',overflowX:'auto' as any,paddingBottom:'2px'}}>
              {(['pending','all','approved','rejected'] as const).map(t=>(
                <button key={t} onClick={()=>setFilter(t)} style={{padding:'7px 14px',borderRadius:'10px',border:`1px solid ${filter===t?'rgba(59,130,246,0.4)':BORDER}`,background:filter===t?'linear-gradient(135deg,rgba(59,130,246,0.22),rgba(139,92,246,0.18))':GLASS,color:filter===t?TEXT:TEXTSUB,fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif",display:'flex',alignItems:'center',gap:'5px',whiteSpace:'nowrap' as any}}>
                  {t.charAt(0).toUpperCase()+t.slice(1)}
                  <span style={{fontSize:'10px',padding:'1px 6px',borderRadius:'6px',background:filter===t?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.08)',fontWeight:800}}>{counts[t]}</span>
                </button>
              ))}
            </div>

            {filtered.length===0 ? (
              <DarkCard style={{padding:'48px 20px',textAlign:'center'}}>
                <p style={{fontSize:'24px',marginBottom:'12px'}}>📭</p>
                <p style={{fontSize:'15px',fontWeight:700,color:TEXTMID,marginBottom:'6px'}}>No {filter==='all'?'':filter} registrations</p>
                <p style={{fontSize:'13px',color:TEXTSUB}}>Nothing to review right now.</p>
              </DarkCard>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {filtered.map(reg=>{
                  const ss=STATUS_STYLE[reg.status];
                  return (
                    <DarkCard key={reg.id} style={{overflow:'hidden'}}>
                      <div style={{padding:'16px 18px'}}>
                        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',marginBottom:'12px'}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'4px',flexWrap:'wrap' as any}}>
                              <h3 style={{fontSize:'16px',fontWeight:800,color:TEXT}}>{reg.business_name}</h3>
                              <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'20px',background:ss.bg,border:`1px solid ${ss.border}`,color:ss.color}}>{reg.status}</span>
                            </div>
                            <p style={{fontSize:'13px',color:TEXTSUB,marginBottom:'2px'}}>{reg.owner_name} · {reg.category}{reg.zip_code?` · ZIP ${reg.zip_code}`:''}</p>
                            <p style={{fontSize:'12px',color:'rgba(96,165,250,0.8)'}}>{reg.email} · {reg.phone}</p>
                          </div>
                          <p style={{fontSize:'11px',color:TEXTSUB,flexShrink:0}}>{timeAgo(reg.submitted_at)}</p>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:reg.message?'12px':'0'}}>
                          {[{l:'Staff',v:reg.num_staff},{l:'Avg Service',v:`${reg.avg_service_minutes}m`}].map(s=>(
                            <div key={s.l} style={{background:GLASSH,border:`1px solid ${BORDER}`,borderRadius:'10px',padding:'10px',textAlign:'center'}}>
                              <p style={{fontSize:'16px',fontWeight:800,color:TEXT,lineHeight:1}}>{s.v}</p>
                              <p style={{fontSize:'10px',color:TEXTSUB,marginTop:'3px',fontWeight:600}}>{s.l}</p>
                            </div>
                          ))}
                        </div>
                        {reg.message && <div style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${BORDER}`,borderRadius:'10px',padding:'10px 12px',marginBottom:'12px'}}><p style={{fontSize:'12px',color:TEXTSUB,lineHeight:1.6,fontStyle:'italic'}}>" {reg.message} "</p></div>}
                        {reg.admin_note && <div style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:'10px',padding:'10px 12px',marginBottom:'12px'}}><p style={{fontSize:'12px',color:'rgba(251,191,36,0.8)'}}>Note: {reg.admin_note}</p></div>}

                        {reg.status==='pending' && (
                          rejectTarget===reg.id ? (
                            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                              <input value={rejectNote} onChange={e=>setRejectNote(e.target.value)} placeholder="Rejection reason (optional)" style={{width:'100%',padding:'10px 13px',background:'rgba(255,255,255,0.06)',border:`1px solid ${BORDERL}`,borderRadius:'10px',color:TEXT,fontSize:'13px',outline:'none',fontFamily:"'Inter',sans-serif",boxSizing:'border-box' as any}} />
                              <div style={{display:'flex',gap:'8px'}}>
                                <button onClick={()=>setRejectTarget(null)} style={{flex:1,padding:'10px',background:GLASS,border:`1px solid ${BORDER}`,borderRadius:'10px',color:TEXTMID,fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Cancel</button>
                                <button onClick={()=>handleReject(reg.id)} disabled={!!actionId} style={{flex:1,padding:'10px',background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'10px',color:'#f87171',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif",opacity:actionId?0.6:1}}>
                                  {actionId===reg.id?'…':'Confirm Reject'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{display:'flex',gap:'8px'}}>
                              <button onClick={()=>handleApprove(reg.id)} disabled={!!actionId} style={{flex:1,padding:'10px',background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:'10px',color:'#34d399',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'all 0.2s',opacity:actionId?0.6:1}}>
                                {actionId===reg.id?'…':'✓ Approve'}
                              </button>
                              <button onClick={()=>setRejectTarget(reg.id)} disabled={!!actionId} style={{flex:1,padding:'10px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'10px',color:'#f87171',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif",opacity:actionId?0.6:1}}>
                                Reject
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </DarkCard>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Shops Tab ── */}
        {mainTab==='shops' && (
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {!shops || shops.length===0 ? (
              <DarkCard style={{padding:'48px 20px',textAlign:'center'}}>
                <p style={{fontSize:'15px',fontWeight:700,color:TEXTMID}}>No live shops yet</p>
              </DarkCard>
            ) : shops.map(shop=>(
              <DarkCard key={shop.id}>
                {editingShop===shop.id && shopEdit ? (
                  <div style={{padding:'18px',display:'flex',flexDirection:'column',gap:'10px'}}>
                    <p style={{fontSize:'13px',fontWeight:700,color:TEXT,marginBottom:'4px'}}>Edit: {shop.name}</p>
                    {[
                      {label:'Name',key:'name' as keyof ShopEdit,type:'text'},
                      {label:'Email',key:'email' as keyof ShopEdit,type:'email'},
                      {label:'Opening',key:'openingTime' as keyof ShopEdit,type:'text'},
                      {label:'Closing',key:'closingTime' as keyof ShopEdit,type:'text'},
                      {label:'New PIN (optional)',key:'adminPin' as keyof ShopEdit,type:'password'},
                    ].map(f=>(
                      <div key={f.key}>
                        <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px'}}>{f.label}</label>
                        <DarkInput type={f.type} value={String(shopEdit[f.key])} onChange={e=>setShopEdit(s=>s?{...s,[f.key]:e.target.value}:s)} />
                      </div>
                    ))}
                    <div>
                      <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px'}}>Category</label>
                      <select value={shopEdit.category} onChange={e=>setShopEdit(s=>s?{...s,category:e.target.value}:s)} style={{width:'100%',padding:'10px 13px',background:'rgba(255,255,255,0.06)',border:`1px solid ${BORDERL}`,borderRadius:'10px',color:TEXT,fontSize:'13px',outline:'none',fontFamily:"'Inter',sans-serif"}}>
                        {CATEGORIES.map(c=><option key={c} value={c} style={{background:'#0f1420'}}>{c}</option>)}
                      </select>
                    </div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <div style={{flex:1}}>
                        <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px'}}>Staff</label>
                        <DarkInput type="number" value={shopEdit.numStaff} onChange={e=>setShopEdit(s=>s?{...s,numStaff:e.target.value}:s)} min="1" max="50" />
                      </div>
                      <div style={{flex:1}}>
                        <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px'}}>Avg Min</label>
                        <DarkInput type="number" value={shopEdit.avgServiceMinutes} onChange={e=>setShopEdit(s=>s?{...s,avgServiceMinutes:e.target.value}:s)} min="1" max="240" />
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'8px'}}>
                      {[
                        {label:'Queue Open',key:'queueOpen' as keyof ShopEdit},
                        {label:'Remote Join',key:'allowRemoteJoin' as keyof ShopEdit},
                      ].map(f=>(
                        <button key={f.key} onClick={()=>setShopEdit(s=>s?{...s,[f.key]:!s[f.key]}:s)}
                          style={{flex:1,padding:'10px',borderRadius:'10px',border:`1px solid ${shopEdit[f.key]?'rgba(16,185,129,0.3)':BORDER}`,background:shopEdit[f.key]?'rgba(16,185,129,0.15)':GLASS,color:shopEdit[f.key]?'#34d399':TEXTSUB,fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
                          {f.label}: {shopEdit[f.key]?'ON':'OFF'}
                        </button>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button onClick={()=>{setEditingShop(null);setShopEdit(null);}} style={{flex:1,padding:'10px',background:GLASS,border:`1px solid ${BORDER}`,borderRadius:'10px',color:TEXTMID,fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Cancel</button>
                      <button onClick={()=>saveShop(shop.id)} disabled={shopSaving} style={{flex:1,padding:'10px',background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif",opacity:shopSaving?0.6:1}}>
                        {shopSaving?'Saving…':'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{padding:'16px 18px'}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',marginBottom:'12px'}}>
                      <div>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px'}}>
                          <h3 style={{fontSize:'15px',fontWeight:800,color:TEXT}}>{shop.name}</h3>
                          <span style={{fontSize:'10px',fontWeight:700,padding:'2px 8px',borderRadius:'20px',background:shop.queue_open?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.1)',border:`1px solid ${shop.queue_open?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.2)'}`,color:shop.queue_open?'#34d399':'#f87171'}}>{shop.queue_open?'Open':'Closed'}</span>
                        </div>
                        <p style={{fontSize:'12px',color:TEXTSUB}}>{shop.category}{shop.zip_code?` · ZIP ${shop.zip_code}`:''} · {shop.num_staff} staff · {shop.avg_service_minutes}m avg</p>
                        {shop.email && <p style={{fontSize:'11px',color:'rgba(96,165,250,0.7)',marginTop:'2px'}}>{shop.email}</p>}
                      </div>
                      <p style={{fontSize:'11px',color:TEXTSUB,flexShrink:0}}>{timeAgo(shop.created_at)}</p>
                    </div>
                    <div style={{display:'flex',gap:'6px',flexWrap:'wrap' as any}}>
                      <Link to={`/admin/${shop.id}`} target="_blank" style={{padding:'7px 12px',borderRadius:'8px',background:'rgba(59,130,246,0.15)',border:'1px solid rgba(59,130,246,0.3)',color:'#60a5fa',fontSize:'12px',fontWeight:700,textDecoration:'none',fontFamily:"'Inter',sans-serif"}}>Admin →</Link>
                      <button onClick={()=>startEditShop(shop)} style={{padding:'7px 12px',borderRadius:'8px',background:GLASSH,border:`1px solid ${BORDERL}`,color:TEXTMID,fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Edit</button>
                      <button onClick={()=>setQrDownloadShop(shop)} style={{padding:'7px 12px',borderRadius:'8px',background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.3)',color:'#a5b4fc',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>QR Flyer</button>
                      <button onClick={()=>sendTutorial(shop.id)} disabled={tutorialSending[shop.id]==='sending'} style={{padding:'7px 12px',borderRadius:'8px',background:'rgba(139,92,246,0.15)',border:'1px solid rgba(139,92,246,0.3)',color:'#a78bfa',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif",opacity:tutorialSending[shop.id]==='sending'?0.6:1}}>
                        {tutorialSending[shop.id]==='sent'?'✓ Sent':tutorialSending[shop.id]==='sending'?'Sending…':'Tutorial'}
                      </button>
                      <button onClick={()=>setDeleteConfirm(shop.id)} style={{padding:'7px 12px',borderRadius:'8px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Delete</button>
                    </div>
                    {shop.category !== 'Clinic' && (
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'10px',paddingTop:'10px',borderTop:`1px solid ${BORDER}`}}>
                      <div>
                        <p style={{fontSize:'12px',fontWeight:700,color:TEXTMID}}>Biweekly Analytics Email</p>
                        {shop.analytics_email && <p style={{fontSize:'11px',color:TEXTSUB,marginTop:'2px'}}>{shop.analytics_email}{shop.last_analytics_sent?` · last sent ${timeAgo(shop.last_analytics_sent)}`:' · never sent'}</p>}
                        {!shop.analytics_email && <p style={{fontSize:'11px',color:TEXTSUB,marginTop:'2px'}}>No email address set</p>}
                      </div>
                      <button
                        onClick={()=>toggleShopAnalytics(shop.id,!shop.analytics_enabled)}
                        disabled={analyticsToggling[shop.id]}
                        style={{position:'relative',width:'44px',height:'24px',borderRadius:'12px',border:'none',background:shop.analytics_enabled?'linear-gradient(135deg,#3b82f6,#8b5cf6)':'rgba(255,255,255,0.12)',cursor:analyticsToggling[shop.id]?'not-allowed':'pointer',transition:'background 0.2s',padding:0,flexShrink:0,boxShadow:shop.analytics_enabled?'0 0 12px rgba(59,130,246,0.35)':'none',opacity:analyticsToggling[shop.id]?0.6:1}}
                      >
                        <span style={{position:'absolute',top:'3px',left:shop.analytics_enabled?'23px':'3px',width:'18px',height:'18px',borderRadius:'9px',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.3)'}} />
                      </button>
                    </div>
                    )}
                  </div>
                )}
              </DarkCard>
            ))}
          </div>
        )}

        {/* ── History Tab ── */}
        {mainTab==='history' && (
          <>
            {!history ? (
              <DarkCard style={{padding:'48px 20px',textAlign:'center'}}><p style={{fontSize:'13px',color:TEXTSUB}}>Loading…</p></DarkCard>
            ) : (() => {
              const nonClinicHistory = history.filter(t => t.shop_category !== 'Clinic');
              if (nonClinicHistory.length === 0) return (
                <DarkCard style={{padding:'48px 20px',textAlign:'center'}}><p style={{fontSize:'13px',color:TEXTSUB}}>No queue history in the last 7 days.</p></DarkCard>
              );
              const grouped: Record<string, Record<string, HistoryTicket[]>> = {};
              for (const t of nonClinicHistory) {
                if (!grouped[t.shop_name]) grouped[t.shop_name] = {};
                const day = fmtDate(t.joined_at);
                if (!grouped[t.shop_name][day]) grouped[t.shop_name][day] = [];
                grouped[t.shop_name][day].push(t);
              }
              return (
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {Object.entries(grouped).map(([shopName,days])=>(
                    <DarkCard key={shopName} style={{overflow:'hidden'}}>
                      <div style={{background:GLASSH,borderBottom:`1px solid ${BORDER}`,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <span style={{fontSize:'14px',fontWeight:700,color:TEXT}}>{shopName}</span>
                        <span style={{fontSize:'12px',color:TEXTSUB}}>{Object.values(days).flat().length} total</span>
                      </div>
                      {Object.entries(days).map(([day,tickets])=>(
                        <div key={day} style={{borderBottom:`1px solid ${BORDER}`}}>
                          <div style={{padding:'8px 16px',background:'rgba(255,255,255,0.02)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                            <span style={{fontSize:'11px',fontWeight:700,color:TEXTSUB,textTransform:'uppercase',letterSpacing:'0.06em'}}>{day}</span>
                            <span style={{fontSize:'11px',color:TEXTSUB}}>{tickets.length} joined</span>
                          </div>
                          <div>
                            {tickets.map(t=>(
                              <div key={t.id} style={{padding:'8px 16px',display:'flex',alignItems:'center',gap:'10px',borderBottom:`1px solid rgba(255,255,255,0.03)`}}>
                                <span style={{fontSize:'12px',fontFamily:'monospace',color:TEXTSUB,flexShrink:0,width:'40px'}}>{fmtTime(t.joined_at)}</span>
                                <span style={{fontSize:'13px',fontWeight:600,color:TEXTMID,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}{(t.party_size??1)>1?` ×${t.party_size}`:''}</span>
                                <span style={{fontSize:'12px',flexShrink:0,fontWeight:600,color:t.served_at?'#34d399':t.exited_at?'#f87171':'#fbbf24'}}>
                                  {t.served_at?`✓ ${fmtTime(t.served_at)}`:t.exited_at?`✕ ${fmtTime(t.exited_at)}`:'active'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </DarkCard>
                  ))}
                </div>
              );
            })()}
          </>
        )}

        {/* ── Edit Pages Tab ── */}
        {mainTab==='edit' && (
          <>
            <div style={{display:'flex',gap:'6px',marginBottom:'14px',flexWrap:'wrap' as any}}>
              {(['home','about','how_to_use','terms','privacy','web_dev','for_clinics'] as const).map(p=>(
                <button key={p} onClick={()=>setEditPage(p)} style={{padding:'7px 14px',borderRadius:'10px',border:`1px solid ${editPage===p?'rgba(59,130,246,0.4)':BORDER}`,background:editPage===p?'rgba(59,130,246,0.15)':GLASS,color:editPage===p?TEXT:TEXTSUB,fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
                  {p==='how_to_use'?'How to Use':p==='web_dev'?'Web Dev':p==='for_clinics'?'For Clinics':p.charAt(0).toUpperCase()+p.slice(1)}
                </button>
              ))}
            </div>

            {contentLoading ? (
              <DarkCard style={{padding:'48px 20px',textAlign:'center'}}><p style={{fontSize:'13px',color:TEXTSUB}}>Loading…</p></DarkCard>
            ) : (
              <>
                {editPage==='home' && (
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <DarkCard style={{padding:'18px'}}>
                      <p style={{fontSize:'13px',fontWeight:700,color:TEXT,marginBottom:'12px'}}>Hero Section</p>
                      <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                        {([
                          {label:'Badge Text (top status pill)',key:'hero_badge' as keyof HomeContent,rows:1},
                          {label:'Headline (use \\n for line break)',key:'hero_headline' as keyof HomeContent,rows:2},
                          {label:'Subtext',key:'hero_subtext' as keyof HomeContent,rows:3},
                          {label:'Button 1 — Primary (View Live Shops)',key:'hero_btn1' as keyof HomeContent,rows:1},
                          {label:'Button 2 — Secondary (Join a Queue)',key:'hero_btn2' as keyof HomeContent,rows:1},
                          {label:'Button 3 — Outline (For Businesses)',key:'hero_btn3' as keyof HomeContent,rows:1},
                        ] as {label:string;key:keyof HomeContent;rows:number}[]).map(f=>(
                          <div key={f.key}>
                            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px',textTransform:'uppercase' as any,letterSpacing:'0.06em'}}>{f.label}</label>
                            {f.rows===1
                              ? <DarkInput type="text" value={String(homeDraft[f.key])} onChange={e=>setHomeDraft(d=>({...d,[f.key]:e.target.value}))} />
                              : <DarkTextarea rows={f.rows} value={String(homeDraft[f.key])} onChange={e=>setHomeDraft(d=>({...d,[f.key]:e.target.value}))} />
                            }
                          </div>
                        ))}
                      </div>
                    </DarkCard>
                    <DarkCard style={{padding:'18px'}}>
                      <p style={{fontSize:'13px',fontWeight:700,color:TEXT,marginBottom:'12px'}}>Live Right Now Section</p>
                      <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                        {([
                          {label:'Section Title',key:'live_title' as keyof HomeContent},
                          {label:'Section Subtitle',key:'live_subtitle' as keyof HomeContent},
                          {label:'CTA Button Text',key:'live_cta' as keyof HomeContent},
                        ] as {label:string;key:keyof HomeContent}[]).map(f=>(
                          <div key={f.key}>
                            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px',textTransform:'uppercase' as any,letterSpacing:'0.06em'}}>{f.label}</label>
                            <DarkInput type="text" value={String(homeDraft[f.key])} onChange={e=>setHomeDraft(d=>({...d,[f.key]:e.target.value}))} />
                          </div>
                        ))}
                      </div>
                    </DarkCard>
                    <DarkCard style={{padding:'18px'}}>
                      <p style={{fontSize:'13px',fontWeight:700,color:TEXT,marginBottom:'12px'}}>How It Works Section</p>
                      <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                        <div>
                          <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px',textTransform:'uppercase' as any,letterSpacing:'0.06em'}}>Section Title</label>
                          <DarkInput type="text" value={homeDraft.how_title} onChange={e=>setHomeDraft(d=>({...d,how_title:e.target.value}))} />
                        </div>
                        <div>
                          <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px',textTransform:'uppercase' as any,letterSpacing:'0.06em'}}>Section Subtitle</label>
                          <DarkTextarea rows={2} value={homeDraft.how_subtitle} onChange={e=>setHomeDraft(d=>({...d,how_subtitle:e.target.value}))} />
                        </div>
                        {homeDraft.how_steps.map((step,i)=>(
                          <div key={i} style={{background:GLASSH,border:`1px solid ${BORDER}`,borderRadius:'12px',padding:'12px'}}>
                            <p style={{fontSize:'11px',fontWeight:700,color:'rgba(167,139,250,0.8)',marginBottom:'8px'}}>Step {i+1}</p>
                            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px'}}>Title</label>
                            <DarkInput type="text" value={step.title} onChange={e=>setHomeDraft(d=>({...d,how_steps:d.how_steps.map((s,ii)=>ii===i?{...s,title:e.target.value}:s)}))} style={{marginBottom:'8px'}} />
                            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px'}}>Description</label>
                            <DarkTextarea rows={2} value={step.desc} onChange={e=>setHomeDraft(d=>({...d,how_steps:d.how_steps.map((s,ii)=>ii===i?{...s,desc:e.target.value}:s)}))} />
                          </div>
                        ))}
                      </div>
                    </DarkCard>
                    <DarkCard style={{padding:'18px'}}>
                      <p style={{fontSize:'13px',fontWeight:700,color:TEXT,marginBottom:'12px'}}>For Businesses Section</p>
                      <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                        {([
                          {label:'Badge Label',key:'biz_badge' as keyof HomeContent},
                          {label:'Headline',key:'biz_headline' as keyof HomeContent},
                          {label:'Body Text',key:'biz_body' as keyof HomeContent},
                          {label:'CTA Button Text',key:'biz_btn' as keyof HomeContent},
                        ] as {label:string;key:keyof HomeContent}[]).map(f=>(
                          <div key={f.key}>
                            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px',textTransform:'uppercase' as any,letterSpacing:'0.06em'}}>{f.label}</label>
                            <DarkInput type="text" value={String(homeDraft[f.key])} onChange={e=>setHomeDraft(d=>({...d,[f.key]:e.target.value}))} />
                          </div>
                        ))}
                        {homeDraft.biz_features.map((feat,i)=>(
                          <div key={i} style={{background:GLASSH,border:`1px solid ${BORDER}`,borderRadius:'12px',padding:'12px'}}>
                            <p style={{fontSize:'11px',fontWeight:700,color:'rgba(167,139,250,0.8)',marginBottom:'8px'}}>Feature Card {i+1}</p>
                            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px'}}>Title</label>
                            <DarkInput type="text" value={feat.title} onChange={e=>setHomeDraft(d=>({...d,biz_features:d.biz_features.map((ff,ii)=>ii===i?{...ff,title:e.target.value}:ff)}))} style={{marginBottom:'8px'}} />
                            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px'}}>Description</label>
                            <DarkTextarea rows={2} value={feat.desc} onChange={e=>setHomeDraft(d=>({...d,biz_features:d.biz_features.map((ff,ii)=>ii===i?{...ff,desc:e.target.value}:ff)}))} />
                          </div>
                        ))}
                      </div>
                    </DarkCard>
                    <DarkCard style={{padding:'18px'}}>
                      <p style={{fontSize:'13px',fontWeight:700,color:TEXT,marginBottom:'12px'}}>For Clinics Section</p>
                      <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                        {([
                          {label:'Badge Label',key:'clinic_badge' as keyof HomeContent},
                          {label:'Headline',key:'clinic_headline' as keyof HomeContent},
                          {label:'Body Text',key:'clinic_body' as keyof HomeContent},
                          {label:'CTA Button Text',key:'clinic_btn' as keyof HomeContent},
                        ] as {label:string;key:keyof HomeContent}[]).map(f=>(
                          <div key={f.key}>
                            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px',textTransform:'uppercase' as any,letterSpacing:'0.06em'}}>{f.label}</label>
                            <DarkInput type="text" value={String(homeDraft[f.key])} onChange={e=>setHomeDraft(d=>({...d,[f.key]:e.target.value}))} />
                          </div>
                        ))}
                        {homeDraft.clinic_features.map((feat,i)=>(
                          <div key={i} style={{background:GLASSH,border:`1px solid ${BORDER}`,borderRadius:'12px',padding:'12px'}}>
                            <p style={{fontSize:'11px',fontWeight:700,color:'rgba(96,165,250,0.8)',marginBottom:'8px'}}>Feature Card {i+1}</p>
                            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px'}}>Title</label>
                            <DarkInput type="text" value={feat.title} onChange={e=>setHomeDraft(d=>({...d,clinic_features:d.clinic_features.map((ff,ii)=>ii===i?{...ff,title:e.target.value}:ff)}))} style={{marginBottom:'8px'}} />
                            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px'}}>Description</label>
                            <DarkTextarea rows={2} value={feat.desc} onChange={e=>setHomeDraft(d=>({...d,clinic_features:d.clinic_features.map((ff,ii)=>ii===i?{...ff,desc:e.target.value}:ff)}))} />
                          </div>
                        ))}
                      </div>
                    </DarkCard>
                    <PrimaryBtn onClick={()=>saveContent('home',homeDraft)} disabled={contentSaving} style={{width:'100%',padding:'13px',borderRadius:'12px',fontSize:'14px'}}>
                      {contentSaving?'Saving…':contentSaved==='home'?'✓ Saved!':'Save Home Page'}
                    </PrimaryBtn>

                    {/* Downloads */}
                    <DarkCard style={{padding:'18px',marginTop:'8px'}}>
                      <p style={{fontSize:'13px',fontWeight:700,color:TEXT,marginBottom:'4px'}}>Brand Assets</p>
                      <p style={{fontSize:'12px',color:TEXTSUB,marginBottom:'14px'}}>Download the Wavit logo files for use in print, signage, or digital materials.</p>
                      <div style={{display:'flex',gap:'10px',flexWrap:'wrap' as any}}>
                        <a
                          href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#0d1428"/><stop offset="100%" stop-color="#160b38"/></linearGradient><linearGradient id="w" x1="6" y1="28" x2="50" y2="28" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#22d3ee"/><stop offset="48%" stop-color="#6366f1"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient><linearGradient id="border" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="rgba(99,147,255,0.35)"/><stop offset="100%" stop-color="rgba(167,139,250,0.2)"/></linearGradient></defs><rect x="0.5" y="0.5" width="55" height="55" rx="13.5" fill="url(#bg)"/><rect x="0.5" y="0.5" width="55" height="55" rx="13.5" stroke="url(#border)" stroke-width="1" fill="none"/><rect x="8" y="1.5" width="40" height="1" rx="0.5" fill="rgba(255,255,255,0.1)"/><path d="M 6 11 C 8 11, 14 43, 19 45 C 24 47, 24.5 20, 28 15 C 31.5 10, 32 47, 37 45 C 42 43, 48 11, 50 11" stroke="url(#w)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="28" cy="15" r="2.4" fill="#e0e7ff" opacity="0.85"/><circle cx="28" cy="15" r="3.8" fill="rgba(99,147,255,0.25)"/></svg>')}`}
                          download="wavit-icon.svg"
                          style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 16px',background:'rgba(59,130,246,0.15)',border:'1px solid rgba(59,130,246,0.3)',borderRadius:'10px',color:'#60a5fa',fontSize:'12px',fontWeight:700,textDecoration:'none',fontFamily:"'Inter',sans-serif"}}
                        >
                          ↓ Wavit Icon (SVG)
                        </a>
                        <a
                          href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg width="120" height="28" viewBox="0 0 120 28" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="wt" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#e2eeff"/><stop offset="20%" stop-color="#a5c4ff"/><stop offset="48%" stop-color="#818cf8"/><stop offset="72%" stop-color="#c4b5fd"/><stop offset="100%" stop-color="#e2eeff"/></linearGradient></defs><text x="0" y="22" font-family="Space Grotesk, system-ui, sans-serif" font-size="24" font-weight="700" letter-spacing="-0.7" fill="url(#wt)" text-transform="lowercase">wavit</text></svg>')}`}
                          download="wavit-wordmark.svg"
                          style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 16px',background:'rgba(139,92,246,0.15)',border:'1px solid rgba(139,92,246,0.3)',borderRadius:'10px',color:'#a78bfa',fontSize:'12px',fontWeight:700,textDecoration:'none',fontFamily:"'Inter',sans-serif"}}
                        >
                          ↓ Wavit Wordmark (SVG)
                        </a>
                      </div>
                    </DarkCard>
                  </div>
                )}

                {editPage==='about' && (
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <DarkCard style={{padding:'18px'}}>
                      <p style={{fontSize:'13px',fontWeight:700,color:TEXT,marginBottom:'12px'}}>About Page</p>
                      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                        {[
                          {label:'Mission Body',key:'mission_body' as keyof AboutContent,rows:4},
                          {label:'Mission Quote',key:'mission_quote' as keyof AboutContent,rows:2},
                          {label:'CTA Tagline',key:'cta_tagline' as keyof AboutContent,rows:2},
                        ].map(f=>(
                          <div key={f.key}>
                            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.06em'}}>{f.label}</label>
                            <DarkTextarea rows={f.rows} value={String(aboutDraft[f.key])} onChange={e=>setAboutDraft(d=>({...d,[f.key]:e.target.value}))} />
                          </div>
                        ))}
                      </div>
                    </DarkCard>
                    <DarkCard style={{padding:'18px'}}>
                      <p style={{fontSize:'13px',fontWeight:700,color:TEXT,marginBottom:'12px'}}>Features</p>
                      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                        {aboutDraft.features.map((f,i)=>(
                          <div key={i} style={{background:GLASSH,border:`1px solid ${BORDER}`,borderRadius:'12px',padding:'14px'}}>
                            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'6px'}}>Title</label>
                            <DarkInput type="text" value={f.title} onChange={e=>setAboutDraft(d=>({...d,features:d.features.map((ff,ii)=>ii===i?{...ff,title:e.target.value}:ff)}))} style={{marginBottom:'8px'}} />
                            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'6px'}}>Description</label>
                            <DarkTextarea rows={2} value={f.desc} onChange={e=>setAboutDraft(d=>({...d,features:d.features.map((ff,ii)=>ii===i?{...ff,desc:e.target.value}:ff)}))} />
                          </div>
                        ))}
                      </div>
                    </DarkCard>
                    <PrimaryBtn onClick={()=>saveContent('about',aboutDraft)} disabled={contentSaving} style={{width:'100%',padding:'13px',borderRadius:'12px',fontSize:'14px'}}>
                      {contentSaving?'Saving…':contentSaved==='about'?'✓ Saved!':'Save About Page'}
                    </PrimaryBtn>
                  </div>
                )}

                {editPage==='how_to_use' && (
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    {[
                      {title:'Customer Steps',key:'customer_steps' as keyof HowToUseContent},
                      {title:'Customer FAQs',key:'customer_faqs' as keyof HowToUseContent,isQA:true},
                      {title:'Business Steps',key:'business_steps' as keyof HowToUseContent},
                      {title:'Business FAQs',key:'business_faqs' as keyof HowToUseContent,isQA:true},
                    ].map(section=>(
                      <DarkCard key={section.key} style={{padding:'18px'}}>
                        <p style={{fontSize:'13px',fontWeight:700,color:TEXT,marginBottom:'12px'}}>{section.title}</p>
                        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                          {(howToUseDraft[section.key] as any[]).map((item:any,i:number)=>(
                            <div key={i} style={{background:GLASSH,border:`1px solid ${BORDER}`,borderRadius:'12px',padding:'12px'}}>
                              <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px'}}>{section.isQA?'Question':'Title'}</label>
                              <DarkInput type="text" value={section.isQA?item.q:item.title} onChange={e=>setHowToUseDraft(d=>({...d,[section.key]:(d[section.key] as any[]).map((it,ii)=>ii===i?section.isQA?{...it,q:e.target.value}:{...it,title:e.target.value}:it)}))} style={{marginBottom:'8px'}} />
                              <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'5px'}}>{section.isQA?'Answer':'Description'}</label>
                              <DarkTextarea rows={2} value={section.isQA?item.a:item.desc} onChange={e=>setHowToUseDraft(d=>({...d,[section.key]:(d[section.key] as any[]).map((it,ii)=>ii===i?section.isQA?{...it,a:e.target.value}:{...it,desc:e.target.value}:it)}))} />
                            </div>
                          ))}
                        </div>
                      </DarkCard>
                    ))}
                    <PrimaryBtn onClick={()=>saveContent('how_to_use',howToUseDraft)} disabled={contentSaving} style={{width:'100%',padding:'13px',borderRadius:'12px',fontSize:'14px'}}>
                      {contentSaving?'Saving…':contentSaved==='how_to_use'?'✓ Saved!':'Save How to Use Page'}
                    </PrimaryBtn>
                  </div>
                )}

                {editPage==='terms' && (
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <DarkCard style={{padding:'18px'}}>
                      <p style={{fontSize:'13px',fontWeight:700,color:TEXT,marginBottom:'12px'}}>Terms of Service</p>
                      <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                        <div>
                          <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.06em'}}>Last Updated</label>
                          <DarkInput type="text" value={termsDraft.last_updated} onChange={e=>setTermsDraft(d=>({...d,last_updated:e.target.value}))} placeholder="e.g. April 2025" />
                        </div>
                        <div>
                          <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.06em'}}>Full Terms Text</label>
                          <DarkTextarea rows={22} value={termsDraft.body} onChange={e=>setTermsDraft(d=>({...d,body:e.target.value}))} placeholder="Paste your full Terms of Service text here…" style={{fontFamily:'monospace',fontSize:'12px',lineHeight:'1.6'}} />
                        </div>
                      </div>
                    </DarkCard>
                    <PrimaryBtn onClick={()=>saveContent('terms',termsDraft)} disabled={contentSaving} style={{width:'100%',padding:'13px',borderRadius:'12px',fontSize:'14px'}}>
                      {contentSaving?'Saving…':contentSaved==='terms'?'✓ Saved!':'Save Terms of Service'}
                    </PrimaryBtn>
                  </div>
                )}

                {editPage==='web_dev' && (
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <DarkCard style={{padding:'18px'}}>
                      <p style={{fontSize:'13px',fontWeight:700,color:TEXT,marginBottom:'12px'}}>Web Development Page</p>
                      <div>
                        <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'6px',textTransform:'uppercase' as any,letterSpacing:'0.06em'}}>Page Content</label>
                        <DarkTextarea rows={24} value={webDevDraft.body} onChange={e=>setWebDevDraft({body:e.target.value})} placeholder="Write your web development page content here…" style={{lineHeight:'1.7'}} />
                      </div>
                    </DarkCard>
                    <PrimaryBtn onClick={()=>saveContent('web_dev',webDevDraft)} disabled={contentSaving} style={{width:'100%',padding:'13px',borderRadius:'12px',fontSize:'14px'}}>
                      {contentSaving?'Saving…':contentSaved==='web_dev'?'✓ Saved!':'Save Web Dev Page'}
                    </PrimaryBtn>
                  </div>
                )}

                {editPage==='for_clinics' && (
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <DarkCard style={{padding:'18px'}}>
                      <p style={{fontSize:'13px',fontWeight:700,color:TEXT,marginBottom:'12px'}}>For Clinics Page</p>
                      <div>
                        <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'6px',textTransform:'uppercase' as any,letterSpacing:'0.06em'}}>Page Content</label>
                        <DarkTextarea rows={24} value={forClinicsDraft.body} onChange={e=>setForClinicsDraft({body:e.target.value})} placeholder="Write your For Clinics page content here…" style={{lineHeight:'1.7'}} />
                      </div>
                    </DarkCard>
                    <PrimaryBtn onClick={()=>saveContent('for_clinics',forClinicsDraft)} disabled={contentSaving} style={{width:'100%',padding:'13px',borderRadius:'12px',fontSize:'14px'}}>
                      {contentSaving?'Saving…':contentSaved==='for_clinics'?'✓ Saved!':'Save For Clinics Page'}
                    </PrimaryBtn>
                  </div>
                )}

                {editPage==='privacy' && (
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <DarkCard style={{padding:'18px'}}>
                      <p style={{fontSize:'13px',fontWeight:700,color:TEXT,marginBottom:'12px'}}>Privacy Policy</p>
                      <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                        <div>
                          <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.06em'}}>Last Updated</label>
                          <DarkInput type="text" value={privacyDraft.last_updated} onChange={e=>setPrivacyDraft(d=>({...d,last_updated:e.target.value}))} placeholder="e.g. April 2025" />
                        </div>
                        <div>
                          <label style={{display:'block',fontSize:'11px',fontWeight:600,color:TEXTSUB,marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.06em'}}>Full Privacy Policy Text</label>
                          <DarkTextarea rows={22} value={privacyDraft.body} onChange={e=>setPrivacyDraft(d=>({...d,body:e.target.value}))} placeholder="Paste your full Privacy Policy text here…" style={{fontFamily:'monospace',fontSize:'12px',lineHeight:'1.6'}} />
                        </div>
                      </div>
                    </DarkCard>
                    <PrimaryBtn onClick={()=>saveContent('privacy',privacyDraft)} disabled={contentSaving} style={{width:'100%',padding:'13px',borderRadius:'12px',fontSize:'14px'}}>
                      {contentSaving?'Saving…':contentSaved==='privacy'?'✓ Saved!':'Save Privacy Policy'}
                    </PrimaryBtn>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Hidden QR canvas for superadmin flyer download */}
      {qrDownloadShop && (
        <div style={{position:'fixed',left:'-9999px',top:'-9999px',pointerEvents:'none',opacity:0}}>
          <QRCodeCanvas
            id="sa-qr-canvas"
            value={`${window.location.origin}/join/${qrDownloadShop.id}`}
            size={720}
            level="H"
            includeMargin={false}
          />
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div onClick={()=>setDeleteConfirm(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',backdropFilter:'blur(10px)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'rgba(10,15,28,0.98)',border:`1px solid ${BORDERL}`,borderRadius:'24px',padding:'28px',width:'100%',maxWidth:'380px',backdropFilter:'blur(24px)',boxShadow:'0 0 60px rgba(239,68,68,0.15)'}}>
            <h3 style={{fontSize:'18px',fontWeight:800,color:TEXT,marginBottom:'8px'}}>Delete this shop?</h3>
            <p style={{fontSize:'14px',color:TEXTSUB,marginBottom:'24px',lineHeight:1.6}}>This will permanently remove the shop and all its queue history. This cannot be undone.</p>
            <div style={{display:'flex',gap:'12px'}}>
              <button onClick={()=>setDeleteConfirm(null)} style={{flex:1,padding:'13px',background:GLASSH,border:`1px solid ${BORDERL}`,borderRadius:'14px',color:TEXTMID,fontWeight:700,fontSize:'14px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Cancel</button>
              <button onClick={()=>deleteShop(deleteConfirm)} disabled={actionId===deleteConfirm+'-delete'} style={{flex:1,padding:'13px',background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'14px',color:'#f87171',fontWeight:700,fontSize:'14px',cursor:'pointer',fontFamily:"'Inter',sans-serif",opacity:actionId?0.6:1}}>
                {actionId===deleteConfirm+'-delete'?'Deleting…':'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
