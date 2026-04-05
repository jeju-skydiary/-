import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Home, 
  ArrowLeft,
  ShoppingBag, 
  Star, 
  ChevronRight, 
  MapPin, 
  ShieldCheck,
  ArrowRight,
  Settings,
  Plus,
  Trash2,
  Save,
  X,
  LogIn,
  LogOut,
  Image as ImageIcon,
  Type as TypeIcon,
  DollarSign,
  GripVertical,
  BarChart3,
  XCircle,
  MessageCircle,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { auth, db } from './firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  getDoc,
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signOut,
  signInAnonymously,
  User as FirebaseUser
} from 'firebase/auth';

// Types
interface GolfClub {
  id: string;
  name: string;
  brand: string;
  type: '클럽세트' | '드라이버' | '아이언' | '퍼터' | '우드' | '유틸리티' | '웨지';
  condition: 'S' | 'A' | 'B';
  pricePerDay: number;
  image: string;
  rating: number;
  reviews: number;
  flex: 'R' | 'SR' | 'S' | 'L';
}

interface UserProfile {
  name: string;
  phone: string;
  isAdmin?: boolean;
}

interface RentalRecord {
  id: string;
  clubId: string;
  clubName: string;
  clubImage: string;
  rentalDate: string;
  returnDate: string;
  totalPrice: number;
  status: '입금대기' | '결제완료' | '대여중' | '반납완료' | '취소됨';
  deliveryLocation: string;
  startTime: string;
  endTime: string;
  userName?: string;
  userPhone?: string;
  isDeletedByUser?: boolean;
  timestamp?: string;
  userId?: string;
}

interface BannerConfig {
  title: string;
  subtitle: string;
  imageUrl: string;
  tag: string;
}

const DATA_VERSION = '2025_v2';

const INITIAL_CLUBS: GolfClub[] = [
  {
    id: '1',
    name: 'Qi10 맥스 드라이버 (2025 신형)',
    brand: 'TaylorMade',
    type: '드라이버',
    condition: 'S',
    pricePerDay: 28000,
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 5.0,
    reviews: 45,
    flex: 'SR'
  },
  {
    id: '2',
    name: '패러다임 Ai 스모크 (2025 에디션)',
    brand: 'Callaway',
    type: '드라이버',
    condition: 'S',
    pricePerDay: 26000,
    image: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 4.9,
    reviews: 112,
    flex: 'S'
  },
  {
    id: '3',
    name: 'GT3 드라이버 (2025 최신상)',
    brand: 'Titleist',
    type: '드라이버',
    condition: 'S',
    pricePerDay: 30000,
    image: 'https://images.unsplash.com/photo-1622398925373-3f91b13f713e?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 4.8,
    reviews: 28,
    flex: 'S'
  },
  {
    id: '4',
    name: 'P790 2025 아이언 세트 (4-P)',
    brand: 'TaylorMade',
    type: '아이언',
    condition: 'A',
    pricePerDay: 48000,
    image: 'https://images.unsplash.com/photo-1592919016327-5050f748bad4?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 4.9,
    reviews: 156,
    flex: 'R'
  },
  {
    id: '5',
    name: 'G430 MAX 10K (2025 업그레이드)',
    brand: 'PING',
    type: '드라이버',
    condition: 'S',
    pricePerDay: 24000,
    image: 'https://images.unsplash.com/photo-1593111774642-996962388656?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 4.7,
    reviews: 89,
    flex: 'S'
  },
  {
    id: '6',
    name: '보키 SM10 웨지 (2025 신상)',
    brand: 'Titleist',
    type: '웨지',
    condition: 'S',
    pricePerDay: 14000,
    image: 'https://images.unsplash.com/photo-1605141014352-094034260341?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 5.0,
    reviews: 34,
    flex: 'S'
  },
  {
    id: '7',
    name: 'TSR2 하이브리드 (2025)',
    brand: 'Titleist',
    type: '유틸리티',
    condition: 'S',
    pricePerDay: 18000,
    image: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 4.8,
    reviews: 21,
    flex: 'SR'
  },
  {
    id: '8',
    name: '스파이더 GT 퍼터 (2025)',
    brand: 'TaylorMade',
    type: '퍼터',
    condition: 'S',
    pricePerDay: 16000,
    image: 'https://images.unsplash.com/photo-1592919016327-5050f748bad4?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 4.9,
    reviews: 56,
    flex: 'R'
  },
  {
    id: '9',
    name: 'OPUS 웨지 (2025 신상)',
    brand: 'Callaway',
    type: '웨지',
    condition: 'S',
    pricePerDay: 13000,
    image: 'https://images.unsplash.com/photo-1605141014352-094034260341?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 4.8,
    reviews: 12,
    flex: 'S'
  },
  {
    id: '10',
    name: '아이언 241 CB (2025)',
    brand: 'Mizuno',
    type: '아이언',
    condition: 'S',
    pricePerDay: 52000,
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 5.0,
    reviews: 18,
    flex: 'R'
  },
  {
    id: '11',
    name: 'Qi10 2025 풀세트 (남성용)',
    brand: 'TaylorMade',
    type: '클럽세트',
    condition: 'S',
    pricePerDay: 120000,
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 5.0,
    reviews: 12,
    flex: 'SR'
  },
  {
    id: '12',
    name: 'GT2 페어웨이 우드 (2025)',
    brand: 'Titleist',
    type: '우드',
    condition: 'S',
    pricePerDay: 22000,
    image: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 4.9,
    reviews: 8,
    flex: 'S'
  },
  {
    id: '13',
    name: '기본 드라이버 (Standard)',
    brand: 'Standard',
    type: '드라이버',
    condition: 'A',
    pricePerDay: 15000,
    image: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 4.5,
    reviews: 10,
    flex: 'R'
  },
  {
    id: '14',
    name: '젝시오 여성 풀세트 (XXIO)',
    brand: 'XXIO',
    type: '클럽세트',
    condition: 'S',
    pricePerDay: 110000,
    image: 'https://images.unsplash.com/photo-1591491640784-3232eb748d4b?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 5.0,
    reviews: 24,
    flex: 'L'
  },
  {
    id: '15',
    name: '로그 남성 풀세트 (Rogue ST)',
    brand: 'Callaway',
    type: '클럽세트',
    condition: 'A',
    pricePerDay: 95000,
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 4.8,
    reviews: 32,
    flex: 'S'
  },
  {
    id: '16',
    name: '야마하 여성 풀세트 (Yamaha)',
    brand: 'Yamaha',
    type: '클럽세트',
    condition: 'S',
    pricePerDay: 105000,
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 4.9,
    reviews: 15,
    flex: 'L'
  },
  {
    id: '17',
    name: '캘러웨이 남성 풀세트 (Callaway)',
    brand: 'Callaway',
    type: '클럽세트',
    condition: 'A',
    pricePerDay: 85000,
    image: 'https://images.unsplash.com/photo-1592919016327-5050f748bad4?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 4.7,
    reviews: 41,
    flex: 'R'
  },
  {
    id: '18',
    name: '기본 풀세트 (Standard Set)',
    brand: 'Standard',
    type: '클럽세트',
    condition: 'B',
    pricePerDay: 55000,
    image: 'https://images.unsplash.com/photo-1605141014352-094034260341?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 4.4,
    reviews: 67,
    flex: 'R'
  },
  {
    id: '19',
    name: '캘러웨이 레바 우드 (Reva)',
    brand: 'Callaway',
    type: '우드',
    condition: 'S',
    pricePerDay: 20000,
    image: 'https://images.unsplash.com/photo-1622398925373-3f91b13f713e?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 4.9,
    reviews: 9,
    flex: 'L'
  },
  {
    id: '20',
    name: '여성용 풀세트 (가성비 모델)',
    brand: 'Standard',
    type: '클럽세트',
    condition: 'A',
    pricePerDay: 75000,
    image: 'https://images.unsplash.com/photo-1593111774642-996962388656?auto=format&fit=crop&q=80&w=600&h=600',
    rating: 4.6,
    reviews: 22,
    flex: 'L'
  }
];

const INITIAL_BANNER: BannerConfig = {
  title: "2025 시즌 신상 전격 입고\nJEJU RENT CLUB",
  subtitle: "테일러메이드 Qi10, 타이틀리스트 GT3 등 최신 모델 즉시 대여",
  imageUrl: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1920&h=1080",
  tag: "2025 최신 모델 보유"
};

const CATEGORIES = ['전체', '클럽세트', '드라이버', '아이언', '퍼터', '우드', '유틸리티', '웨지'];

export default function App() {
  const [clubs, setClubs] = useState<GolfClub[]>(INITIAL_CLUBS);
  const [banner, setBanner] = useState<BannerConfig>(INITIAL_BANNER);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState<GolfClub | null>(null);
  
  // User States
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [rentalHistory, setRentalHistory] = useState<RentalRecord[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [rentalDays, setRentalDays] = useState(1);
  const [rentalDate, setRentalDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [cart, setCart] = useState<RentalRecord[]>(() => {
    const saved = localStorage.getItem('gr_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [paymentSource, setPaymentSource] = useState<'cart' | 'history'>('cart');
  const [paymentHistoryItems, setPaymentHistoryItems] = useState<RentalRecord[]>([]);
  const [lastOrder, setLastOrder] = useState<RentalRecord[]>([]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ name: '', phone: '' });
  const [lastRental, setLastRental] = useState<RentalRecord | null>(null);
  const [signUpForm, setSignUpForm] = useState({ name: '', phone: '' });

  // Refs for focusing inputs
  const deliveryRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);

  // Admin States
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'mypage' | 'admin'>('home');
  const [adminFilterDate, setAdminFilterDate] = useState('');
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [showCancelSuccessModal, setShowCancelSuccessModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      // Fallback for non-secure contexts or older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        textArea.remove();
        return Promise.resolve();
      } catch (err) {
        textArea.remove();
        return Promise.reject(err);
      }
    }
  };

  // Firebase Error Handler
  const handleFirestoreError = (error: unknown, operationType: string, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              name: userData.name,
              phone: userData.phone,
              isAdmin: userData.role === 'admin' || fUser.email === "cmhadstory@gmail.com"
            });
          }
        } catch (error) {
          console.error('Profile fetch error:', error);
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync Clubs
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'clubs'), (snapshot) => {
      const clubsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GolfClub));
      
      if (clubsData.length > 0) {
        setClubs(clubsData);
        
        // Only admin can sync initial clubs to Firestore
        if (user?.isAdmin) {
          const existingIds = new Set(clubsData.map(c => c.id));
          const newClubs = INITIAL_CLUBS.filter(c => !existingIds.has(c.id));
          
          if (newClubs.length > 0) {
            newClubs.forEach(async (club) => {
              try {
                await setDoc(doc(db, 'clubs', club.id), club);
              } catch (e) {
                console.error('Initial club sync failed:', e);
              }
            });
          }
        }
      } else if (user?.isAdmin) {
        // Initial migration if empty
        INITIAL_CLUBS.forEach(async (club) => {
          try {
            await setDoc(doc(db, 'clubs', club.id), club);
          } catch (e) {
            console.error('Initial club migration failed:', e);
          }
        });
      }
    }, (error) => handleFirestoreError(error, 'list', 'clubs'));
    return () => unsubscribe();
  }, [user?.isAdmin]);

  // Sync Banner
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'config', 'banner'), (snapshot) => {
      if (snapshot.exists()) {
        setBanner(snapshot.data() as BannerConfig);
      } else {
        setDoc(doc(db, 'config', 'banner'), INITIAL_BANNER);
      }
    }, (error) => handleFirestoreError(error, 'get', 'config/banner'));
    return () => unsubscribe();
  }, []);

  // Sync Rentals
  useEffect(() => {
    if (!isAuthReady) return;
    
    let q;
    if (user?.isAdmin) {
      q = query(collection(db, 'rentals'), orderBy('rentalDate', 'desc'));
    } else if (firebaseUser) {
      q = query(collection(db, 'rentals'), where('userId', '==', firebaseUser.uid), orderBy('rentalDate', 'desc'));
    } else {
      setRentalHistory([]);
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rentalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RentalRecord));
      setRentalHistory(rentalsData);
    }, (error) => handleFirestoreError(error, 'list', 'rentals'));
    return () => unsubscribe();
  }, [isAuthReady, user?.isAdmin, firebaseUser]);

  const handleLogin = () => {
    setShowSignUp(true);
  };

  const handleLogout = async () => {
    console.log('Logging out...');
    try {
      await signOut(auth);
      setUser(null);
      setShowLogoutConfirm(false);
      setActiveTab('home');
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAdminLogin = async () => {
    if (adminPassword === 'admin1234') {
      // Firebase Auth가 실패하더라도 로컬 상태로 관리자 모드 진입
      setUser({
        name: '관리자',
        phone: '',
        isAdmin: true
      });
      
      // 시도만 해보고 실패해도 무시 (보안규칙이 이미 풀려있으므로)
      try {
        if (!firebaseUser) {
          const result = await signInAnonymously(auth);
          setFirebaseUser(result.user);
        }
      } catch (e) {
        console.log('Auth failed but proceeding as guest admin');
      }
      
      setShowAdminLogin(false);
      setAdminPassword('');
      setActiveTab('admin');
      alert('관리자 모드로 전환되었습니다.');
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const handleSignUp = async () => {
    if (!signUpForm.name || !signUpForm.phone) {
      alert('이름과 전화번호를 모두 입력해주세요.');
      return;
    }
    
    // 로컬 상태 즉시 업데이트 (로그인 없이도 작동하게)
    const userData = {
      name: signUpForm.name,
      phone: signUpForm.phone,
      isAdmin: false
    };
    setUser(userData);
    
    // Firestore 저장 시도 (보안규칙이 풀려있으므로 익명로그인 실패해도 ID만 있으면 됨)
    try {
      let uid = firebaseUser?.uid || `guest_${Date.now()}`;
      if (!firebaseUser) {
        try {
          const result = await signInAnonymously(auth);
          uid = result.user.uid;
          setFirebaseUser(result.user);
        } catch (e) {
          console.log('Auth failed, using guest ID');
        }
      }
      
      await setDoc(doc(db, 'users', uid), {
        ...userData,
        role: 'user'
      });
    } catch (error) {
      console.error('Firestore save error:', error);
    }
    
    setShowSignUp(false);
    setSignUpForm({ name: '', phone: '' });
    alert('가입이 완료되었습니다!');
  };

  const handleRental = async (club: GolfClub, isAddingMore: boolean = false) => {
    console.log('handleRental called:', club.name, 'isAddingMore:', isAddingMore);
    
    // '클럽 추가하기' (장바구니 담기)는 로그인/정보입력 없이도 가능하게 변경
    if (!isAddingMore) {
      if (!user || user.phone === '') {
        console.log('User not logged in, showing login modal');
        handleLogin();
        return;
      }

      if (!deliveryLocation || !rentalDate || !startTime || !endTime) {
        alert('배송지, 날짜, 시간을 모두 입력해주세요.');
        return;
      }
    }

    try {
      const start = new Date(rentalDate || new Date().toISOString().split('T')[0]);
      const end = new Date(start);
      end.setDate(start.getDate() + rentalDays);

      const uid = firebaseUser?.uid || `guest_${Date.now()}`;
      const newRecord: RentalRecord = {
        id: Date.now().toString(),
        clubId: club.id,
        clubName: club.name,
        clubImage: club.image,
        rentalDate: rentalDate || new Date().toISOString().split('T')[0],
        returnDate: end.toLocaleDateString(),
        totalPrice: club.pricePerDay * rentalDays,
        status: '입금대기',
        deliveryLocation: deliveryLocation || '미지정',
        startTime: startTime || '00:00',
        endTime: endTime || '00:00',
        userName: user?.name || '게스트',
        userPhone: user?.phone || '',
        userId: uid,
        timestamp: new Date().toISOString()
      };

      setCart(prev => [...prev, newRecord]);
      
      if (!isAddingMore) {
        setSelectedClub(null);
        setPaymentSource('cart');
        setShowPaymentInfo(true);
      } else {
        alert('장바구니에 추가되었습니다!');
      }
    } catch (error) {
      console.error('handleRental error:', error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handlePaymentConfirm = async () => {
    const itemsToPay = paymentSource === 'cart' ? cart : paymentHistoryItems;
    if (user && itemsToPay.length > 0) {
      const totalAmount = itemsToPay.reduce((sum, item) => sum + item.totalPrice, 0);
      const itemsList = itemsToPay.map(item => `- ${item.clubName} (${item.totalPrice.toLocaleString()}원)`).join('\n');
      
      const message = `[제주 렌트 클럽 예약 신청]\n성함: ${user.name}\n연락처: ${user.phone}\n\n[예약 클럽]\n${itemsList}\n\n총 금액: ${totalAmount.toLocaleString()}원\n대여일: ${itemsToPay[0].rentalDate}\n반납일: ${itemsToPay[0].returnDate}\n배송지: ${itemsToPay[0].deliveryLocation}\n라운딩시간: ${itemsToPay[0].startTime} ~ ${itemsToPay[0].endTime}\n\n입금 후 확인 부탁드립니다!`;
      
      const performCopy = () => {
        copyToClipboard(message).then(() => {
          alert('예약 내역이 복사되었습니다. 카카오톡(관리자/본인)으로 전송해주세요!');
          window.open('https://pf.kakao.com/', '_blank');
        }).catch(() => {
          alert('복사에 실패했습니다. 수동으로 내용을 입력해주세요.');
        });
      };

      if (navigator.share) {
        navigator.share({
          title: '제주 렌트 클럽 예약',
          text: message,
        }).catch(() => {
          performCopy();
        });
      } else {
        performCopy();
      }

      try {
        const uid = firebaseUser?.uid || `guest_${Date.now()}`;
        if (paymentSource === 'cart') {
          for (const item of cart) {
            const rentalData = {
              ...item,
              status: '입금대기' as const,
              timestamp: new Date().toISOString(),
              userId: uid
            };
            await setDoc(doc(db, 'rentals', item.id), rentalData);
          }
          setCart([]);
          setDeliveryLocation('');
          setStartTime('');
          setEndTime('');
          setRentalDays(1);
        } else {
          for (const item of paymentHistoryItems) {
            await updateDoc(doc(db, 'rentals', item.id), { status: '입금대기' });
          }
        }
        
        setShowPaymentInfo(false);
        setActiveTab('mypage');
      } catch (error) {
        console.error('Rental save error:', error);
        alert('저장에 실패했습니다.');
      }
    }
  };

  const handleUpdateRentalStatus = async (id: string, newStatus: '입금대기' | '결제완료' | '대여중' | '반납완료' | '취소됨') => {
    try {
      await updateDoc(doc(db, 'rentals', id), { 
        status: newStatus,
        isDeletedByUser: newStatus === '취소됨' ? true : false
      });
    } catch (error) {
      handleFirestoreError(error, 'update', `rentals/${id}`);
    }
  };

  const deleteRental = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'rentals', id));
    } catch (error) {
      handleFirestoreError(error, 'delete', `rentals/${id}`);
    }
  };

  const handleExportExcel = () => {
    const filtered = adminFilterDate 
      ? rentalHistory.filter(r => r.rentalDate === adminFilterDate)
      : rentalHistory;
    
    if (filtered.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    // Header
    const header = ['날짜', '고객명', '연락처', '상품명', '배송지', '시작시간', '종료시간', '금액', '상태'].join('\t');
    
    // Rows
    const rows = filtered.map(r => [
      r.rentalDate,
      r.userName || '',
      r.userPhone || '',
      r.clubName,
      r.deliveryLocation,
      r.startTime,
      r.endTime,
      r.totalPrice,
      r.status
    ].join('\t')).join('\n');

    const tsvContent = `${header}\n${rows}`;
    
    copyToClipboard(tsvContent).then(() => {
      alert('매출 데이터가 클립보드에 복사되었습니다. 엑셀에 붙여넣기(Ctrl+V) 하세요!');
    }).catch(() => {
      alert('복사에 실패했습니다.');
    });
  };

  const handleUpdateProfile = async () => {
    if (!user || !firebaseUser) return;
    const updatedUser = { ...user, ...editProfileForm };
    
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        name: editProfileForm.name,
        phone: editProfileForm.phone,
        role: user.isAdmin ? 'admin' : 'user'
      }, { merge: true });
      
      setUser(updatedUser);
      setShowEditProfile(false);
      alert('프로필이 수정되었습니다.');
    } catch (error) {
      console.error('Profile update error:', error);
      handleFirestoreError(error, 'update', `users/${firebaseUser.uid}`);
      alert('프로필 수정에 실패했습니다.');
    }
  };

  const visibleHistory = useMemo(() => 
    rentalHistory.filter(r => !r.isDeletedByUser),
    [rentalHistory]
  );

  const filteredClubs = clubs.filter(club => {
    const matchesCategory = selectedCategory === '전체' || club.type === selectedCategory;
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         club.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const updateClub = (id: string, updates: Partial<GolfClub>) => {
    setClubs(prev => {
      const newClubs = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      return newClubs;
    });
  };

  const saveAdminSettings = async () => {
    console.log('Saving admin settings...');
    const saveBtn = document.activeElement as HTMLButtonElement;
    if (saveBtn) saveBtn.disabled = true;
    
    try {
      const batch = writeBatch(db);
      
      // Save banner
      batch.set(doc(db, 'config', 'banner'), banner);
      
      // Save clubs
      for (const club of clubs) {
        if (club.id) {
          batch.set(doc(db, 'clubs', club.id), club);
        }
      }
      
      await batch.commit();
      console.log('Admin settings saved successfully');
      
      alert('설정이 저장되었습니다.');
      setActiveTab('home');
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Save settings error:', error);
      handleFirestoreError(error, 'write', 'admin_settings');
      alert('저장에 실패했습니다. 권한을 확인해주세요.');
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  };

  const deleteClub = async (id: string) => {
    openConfirm('상품 삭제', '정말 이 상품을 삭제하시겠습니까?', async () => {
      try {
        await deleteDoc(doc(db, 'clubs', id));
        setClubs(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        handleFirestoreError(error, 'delete', `clubs/${id}`);
      }
    });
  };

  const removeFromCart = (idx: number) => {
    setCart(prev => {
      const newCart = prev.filter((_, i) => i !== idx);
      localStorage.setItem('gr_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateClub(id, { image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBanner({ ...banner, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addNewClub = () => {
    const newClub: GolfClub = {
      id: Date.now().toString(),
      name: '새로운 클럽',
      brand: '브랜드명',
      type: '드라이버',
      condition: 'A',
      pricePerDay: 20000,
      image: 'https://picsum.photos/seed/new/600/600',
      rating: 5.0,
      reviews: 0,
      flex: 'SR'
    };
    setClubs([newClub, ...clubs]);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">로그아웃</h2>
              <p className="text-slate-400 text-sm mb-8">정말 로그아웃 하시겠습니까?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-4 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-all"
                >
                  취소
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  로그아웃
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign Up Modal */}
      <AnimatePresence>
        {showSignUp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold">간편 회원가입</h2>
                <p className="text-slate-400 text-sm mt-2">이름과 전화번호만으로 시작하세요.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">이름</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-100 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={signUpForm.name}
                    onChange={(e) => setSignUpForm({ ...signUpForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">전화번호</label>
                  <input 
                    type="tel" 
                    className="w-full bg-slate-100 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={signUpForm.phone}
                    onChange={(e) => setSignUpForm({ ...signUpForm, phone: e.target.value })}
                  />
                </div>
                <button 
                  onClick={handleSignUp}
                  className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  가입 및 로그인
                </button>

                <button 
                  onClick={() => setShowSignUp(false)}
                  className="w-full py-2 text-slate-400 text-sm font-medium"
                >
                  나중에 하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{confirmModal.title}</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">{confirmModal.message}</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                  className="py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, show: false }));
                  }}
                  className="py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Dashboard Page (Separate View) */}
      <AnimatePresence>
        {activeTab === 'admin' && user?.isAdmin && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed inset-0 z-[100] bg-white overflow-y-auto p-6 pb-24"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-emerald-600" />
                  <h2 className="text-2xl font-bold">관리자 대시보드</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> 로그아웃
                  </button>
                  <button 
                    onClick={() => setActiveTab('home')}
                    className="p-2 hover:bg-slate-100 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Sales Statistics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm">
                  <p className="text-xs text-emerald-600 font-bold mb-1 uppercase tracking-wider">총 대여 건수</p>
                  <p className="text-3xl font-black text-emerald-900">{rentalHistory.length}건</p>
                </div>
                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm">
                  <p className="text-xs text-amber-600 font-bold mb-1 uppercase tracking-wider">총 매출 (취소 제외)</p>
                  <p className="text-3xl font-black text-amber-900">{rentalHistory.filter(r => r.status !== '취소됨').reduce((s, r) => s + r.totalPrice, 0).toLocaleString()}원</p>
                </div>
              </div>

              {/* Monthly Status Summary */}
              <div className="bg-slate-100 text-slate-900 p-4 rounded-2xl mb-12 shadow-sm border border-slate-200 flex items-center justify-between px-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-bold">이번달의 진행 상태 :</span>
                </div>
                <div className="flex gap-8">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">대여중</span>
                    <span className="text-lg font-black text-amber-600">
                      {rentalHistory.filter(r => r.rentalDate.startsWith(new Date().toISOString().slice(0, 7)) && r.status === '대여중').length}건
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">입금대기</span>
                    <span className="text-lg font-black text-blue-600">
                      {rentalHistory.filter(r => r.rentalDate.startsWith(new Date().toISOString().slice(0, 7)) && r.status === '입금대기').length}건
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">완료건</span>
                    <span className="text-lg font-black text-emerald-600">
                      {rentalHistory.filter(r => r.rentalDate.startsWith(new Date().toISOString().slice(0, 7)) && (r.status === '결제완료' || r.status === '반납완료')).length}건
                    </span>
                  </div>
                </div>
              </div>

              {/* Daily Sales Report */}
              <section className="mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" /> 일자별 상세 매출 리스트
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <input 
                        type="date" 
                        className="text-xs font-bold outline-none bg-transparent"
                        value={adminFilterDate}
                        onChange={(e) => setAdminFilterDate(e.target.value)}
                      />
                      {adminFilterDate && (
                        <button onClick={() => setAdminFilterDate('')} className="text-slate-400 hover:text-slate-600">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={handleExportExcel}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                    >
                      <Save className="w-4 h-4" /> 엑셀 복사
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto no-scrollbar">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-3 font-bold text-slate-500">날짜</th>
                          <th className="px-3 py-3 font-bold text-slate-500">고객명</th>
                          <th className="px-3 py-3 font-bold text-slate-500">연락처</th>
                          <th className="px-3 py-3 font-bold text-slate-500">상품명</th>
                          <th className="px-3 py-3 font-bold text-slate-500">배송지</th>
                          <th className="px-3 py-3 font-bold text-slate-500">시간</th>
                          <th className="px-3 py-3 font-bold text-slate-500">금액</th>
                          <th className="px-3 py-3 font-bold text-slate-500">상태</th>
                          <th className="px-3 py-3 font-bold text-slate-500">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {(() => {
                          const filtered = adminFilterDate 
                            ? rentalHistory.filter(r => r.rentalDate === adminFilterDate)
                            : rentalHistory;
                          
                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={9} className="px-3 py-10 text-center text-slate-400">매출 내역이 없습니다.</td>
                              </tr>
                            );
                          }

                          let lastUserName = '';
                          let useAltBg = false;
                          return [...filtered].sort((a, b) => b.rentalDate.localeCompare(a.rentalDate)).map(record => {
                            if (record.userName !== lastUserName) {
                              useAltBg = !useAltBg;
                              lastUserName = record.userName || '';
                            }
                            return (
                              <tr key={record.id} className={`transition-colors ${useAltBg ? 'bg-slate-200/60' : 'bg-white'} hover:bg-emerald-50/30`}>
                                <td className="px-3 py-3 font-medium text-slate-600 whitespace-nowrap">{record.rentalDate}</td>
                                <td className="px-3 py-3 font-bold text-slate-900">{record.userName || '미입력'}</td>
                                <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{record.userPhone || '미입력'}</td>
                                <td className="px-3 py-3 text-slate-600 font-medium">{record.clubName}</td>
                                <td className="px-3 py-3 text-slate-500 min-w-[120px]">{record.deliveryLocation}</td>
                                <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{record.startTime}~{record.endTime}</td>
                                <td className="px-3 py-3 font-bold text-emerald-700">{record.totalPrice.toLocaleString()}원</td>
                                <td className="px-3 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    record.status === '대여중' ? 'bg-amber-100 text-amber-600' : 
                                    record.status === '결제완료' ? 'bg-emerald-100 text-emerald-600' : 
                                    record.status === '입금대기' ? 'bg-blue-100 text-blue-600' :
                                    record.status === '반납완료' ? 'bg-slate-100 text-slate-600' :
                                    record.status === '취소됨' ? 'bg-red-100 text-red-600' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {record.status}
                                  </span>
                                  <select 
                                    value={record.status}
                                    onChange={(e) => handleUpdateRentalStatus(record.id, e.target.value as any)}
                                    className="ml-2 text-[8px] bg-slate-100 border-none rounded px-1 py-0.5 focus:ring-1 focus:ring-emerald-500 outline-none"
                                  >
                                    <option value="입금대기">입금대기</option>
                                    <option value="결제완료">결제완료</option>
                                    <option value="대여중">대여중</option>
                                    <option value="반납완료">반납완료</option>
                                    <option value="취소됨">취소됨</option>
                                  </select>
                                </td>
                                <td className="px-3 py-3">
                                  <button 
                                    onClick={() => {
                                      openConfirm('기록 영구 삭제', '이 기록을 영구적으로 삭제하시겠습니까? (관리자 전용)', () => {
                                        deleteRental(record.id);
                                      });
                                    }}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Banner Editing */}
              <section className="mb-12 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-600" /> 메인 배너 설정
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">배너 제목 (줄바꿈은 \n)</label>
                      <textarea 
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={banner.title}
                        onChange={(e) => setBanner({ ...banner, title: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">서브텍스트 / 가격</label>
                      <input 
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={banner.subtitle}
                        onChange={(e) => setBanner({ ...banner, subtitle: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">배너 이미지 (웹 URL 권장)</label>
                      <div className="flex gap-2">
                        <input 
                          className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                          value={banner.imageUrl}
                          onChange={(e) => setBanner({ ...banner, imageUrl: e.target.value })}
                          placeholder="https://... (이미지 주소 붙여넣기)"
                        />
                        <label className="p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                          <ImageIcon className="w-5 h-5 text-emerald-600" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleBannerImageUpload} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">태그 (예: 신규 입고)</label>
                      <input 
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={banner.tag}
                        onChange={(e) => setBanner({ ...banner, tag: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Club Editing */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-emerald-600" /> 상품 리스트 관리
                  </h3>
                  <button 
                    onClick={addNewClub}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> 상품 추가
                  </button>
                </div>
                
                <Reorder.Group axis="y" values={clubs} onReorder={setClubs} className="space-y-4">
                  {clubs.map((club) => (
                    <Reorder.Item 
                      key={club.id} 
                      value={club}
                      className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 relative group"
                    >
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5 text-slate-300" />
                      </div>
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 ml-4 md:ml-2">
                        <img src={club.image} alt={club.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-12 gap-3">
                        <div className="col-span-2 md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-400">상품명</label>
                          <input 
                            className="w-full p-2 text-sm border-b border-slate-100 focus:border-emerald-500 outline-none"
                            value={club.name}
                            onChange={(e) => updateClub(club.id, { name: e.target.value })}
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400">브랜드</label>
                          <input 
                            className="w-full p-2 text-sm border-b border-slate-100 focus:border-emerald-500 outline-none"
                            value={club.brand}
                            onChange={(e) => updateClub(club.id, { brand: e.target.value })}
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400">종류</label>
                          <select 
                            className="w-full p-2 text-sm border-b border-slate-100 focus:border-emerald-500 outline-none bg-transparent"
                            value={club.type}
                            onChange={(e) => updateClub(club.id, { type: e.target.value })}
                          >
                            {CATEGORIES.filter(c => c !== '전체').map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400">등급</label>
                          <select 
                            className="w-full p-2 text-sm border-b border-slate-100 focus:border-emerald-500 outline-none bg-transparent"
                            value={club.condition}
                            onChange={(e) => updateClub(club.id, { condition: e.target.value as any })}
                          >
                            <option value="S">S 등급</option>
                            <option value="A">A 등급</option>
                            <option value="B">B 등급</option>
                          </select>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400">강도(Flex)</label>
                          <input 
                            className="w-full p-2 text-sm border-b border-slate-100 focus:border-emerald-500 outline-none"
                            value={club.flex}
                            onChange={(e) => updateClub(club.id, { flex: e.target.value })}
                          />
                        </div>
                        <div className="col-span-2 md:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-400">일일 대여료</label>
                          <input 
                            type="number"
                            className="w-full p-2 text-sm border-b border-slate-100 focus:border-emerald-500 outline-none"
                            value={club.pricePerDay}
                            onChange={(e) => updateClub(club.id, { pricePerDay: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="col-span-2 md:col-span-9">
                          <label className="block text-[10px] font-bold text-slate-400">이미지 설정 및 관리 (웹 URL 권장)</label>
                          <div className="flex items-center gap-2">
                            <input 
                              className="flex-1 p-2 text-sm border-b border-slate-100 focus:border-emerald-500 outline-none"
                              value={club.image}
                              onChange={(e) => updateClub(club.id, { image: e.target.value })}
                              placeholder="https://... (이미지 주소 붙여넣기)"
                            />
                            <label className="p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 shrink-0">
                              <ImageIcon className="w-4 h-4 text-emerald-600" />
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(club.id, e)} />
                            </label>
                            <button 
                              onClick={() => deleteClub(club.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                              title="상품 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </section>

              <div className="mt-12 flex justify-center">
                <button 
                  onClick={saveAdminSettings}
                  className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <Save className="w-6 h-6" /> 설정 저장 및 홈으로
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold">관리자 로그인</h2>
                <p className="text-slate-400 text-sm mt-2">콘텐츠 수정을 위해 로그인하세요.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">비밀번호</label>
                  <input 
                    type="password" 
                    className="w-full bg-slate-100 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="비밀번호를 입력하세요"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                  />
                </div>
                <button 
                  onClick={handleAdminLogin}
                  className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  로그인
                </button>
                <button 
                  onClick={() => setShowAdminLogin(false)}
                  className="w-full py-2 text-slate-400 text-sm font-medium"
                >
                  취소
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">J</div>
            <h1 className="text-xl font-bold tracking-tight text-emerald-900">JEJU RENT CLUB</h1>
          </button>
          <div className="flex items-center gap-1">
            {user?.isAdmin && (
              <button 
                onClick={() => setActiveTab('admin')}
                className={`p-2 rounded-full transition-colors ${activeTab === 'admin' ? 'bg-emerald-100 text-emerald-600' : 'text-emerald-600 hover:bg-emerald-50'}`}
                title="관리자 대시보드"
              >
                <Settings className="w-6 h-6" />
              </button>
            )}
            {(!user || user.phone === '') ? (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold"
              >
                <LogIn className="w-4 h-4" /> 로그인
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">{user.name}님</span>
                <button 
                  onClick={() => setShowLogoutConfirm(true)}
                  className="p-1.5 text-slate-400 hover:text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="브랜드, 클럽명 검색..." 
            className="w-full bg-slate-100 border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-lg shadow-sm">
            <Filter className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-6">
        {activeTab === 'home' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Floating Cart Button */}
            {cart.length > 0 && (
              <motion.button
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                onClick={() => {
                  setPaymentSource('cart');
                  setShowPaymentInfo(true);
                }}
                className="fixed bottom-24 right-6 z-[100] bg-emerald-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all"
              >
                <div className="relative">
                  <ShoppingBag className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-emerald-600">
                    {cart.length}
                  </span>
                </div>
                <span className="font-bold text-sm pr-1">장바구니 결제</span>
              </motion.button>
            )}
            
            {/* Banner */}
            <section className="mb-8 rounded-2xl bg-emerald-900 overflow-hidden relative min-h-[180px]">
              <div className="p-6 text-white relative z-10 max-w-[60%]">
                <span className="inline-block px-2 py-1 bg-emerald-500 text-[10px] font-bold rounded mb-2 uppercase tracking-wider">{banner.tag}</span>
                <h2 className="text-2xl font-bold mb-2 leading-tight whitespace-pre-line">
                  {banner.title.replace('\\n', '\n')}
                </h2>
                <p className="text-emerald-100 text-sm mb-4 opacity-80">{banner.subtitle}</p>
                <button className="bg-white text-emerald-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-50 transition-colors">
                  클럽세트로 도전하세요 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-40 pointer-events-none">
                <img 
                  src={banner.imageUrl} 
                  alt="Banner" 
                  className="object-cover w-full h-full"
                  referrerPolicy="no-referrer"
                />
              </div>
            </section>

            {/* Categories */}
            <section className="mb-6 overflow-x-auto no-scrollbar flex gap-2 pb-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat 
                    ? (cat === '클럽세트' ? 'bg-red-600 text-white shadow-lg shadow-red-200 scale-105' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200')
                    : (cat === '클럽세트' ? 'bg-white text-red-600 border-2 border-red-500 hover:bg-red-50 animate-pulse' : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300')
                  }`}
                >
                  {cat}
                </button>
              ))}
            </section>

            {/* Club List */}
            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredClubs.map((club) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={club.id}
                  onClick={() => setSelectedClub(club)}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-100">
                    <img 
                      src={club.image} 
                      alt={club.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                        club.condition === 'S' ? 'bg-amber-500' : 
                        club.condition === 'A' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}>
                        {club.condition} 등급
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">{club.brand}</p>
                    <h3 className="font-bold text-sm line-clamp-1 mb-1">{club.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-bold text-slate-700">{club.rating}</span>
                      <span className="text-[10px] text-slate-400">({club.reviews})</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 leading-none mb-1">일일 대여료</p>
                        <p className="font-bold text-emerald-700">{club.pricePerDay.toLocaleString()} <span className="text-[10px] font-normal">원</span></p>
                      </div>
                      <div className="bg-slate-100 rounded-md px-2 py-1">
                        <span className="text-[10px] font-bold text-slate-600">{club.flex}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </section>

            {filteredClubs.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">검색 결과가 없습니다.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'admin' && user?.isAdmin && (
          <div className="hidden">
            {/* This section is now consolidated into the fixed view above */}
          </div>
        )}
        {activeTab === 'mypage' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {(!user || user.phone === '') ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
                <User className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">로그인이 필요합니다</h3>
                <p className="text-slate-400 mb-6">대여 내역 확인을 위해 로그인해주세요.</p>
                <button 
                  onClick={handleLogin}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold"
                >
                  로그인
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile Card */}
                <div className="bg-emerald-900 rounded-3xl p-6 text-white flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl font-bold">
                      {user.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">{user.name}님</h3>
                        {user.isAdmin && (
                          <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Admin</span>
                        )}
                      </div>
                      <p className="text-emerald-200 text-sm">{user.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user.isAdmin && (
                      <button 
                        onClick={() => setActiveTab('admin')}
                        className="bg-amber-500 hover:bg-amber-600 p-3 rounded-xl transition-colors shadow-lg"
                        title="관리자 대시보드"
                      >
                        <ShieldCheck className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setEditProfileForm({ name: user.name, phone: user.phone });
                        setShowEditProfile(true);
                      }}
                      className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Rental History */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-emerald-600 rounded"
                          checked={visibleHistory.length > 0 && selectedHistoryIds.length === visibleHistory.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedHistoryIds(visibleHistory.map(r => r.id));
                            } else {
                              setSelectedHistoryIds([]);
                            }
                          }}
                        />
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-emerald-600" /> 나의 대여 내역
                        </h3>
                      </div>
                    </div>
                    {visibleHistory.length === 0 ? (
                      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
                        <ShoppingBag className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">아직 대여한 클럽이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {visibleHistory.map(record => (
                          <div key={record.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex gap-4 relative group">
                            <div className="absolute left-2 top-4 z-10">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-emerald-600 rounded"
                                checked={selectedHistoryIds.includes(record.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedHistoryIds([...selectedHistoryIds, record.id]);
                                  } else {
                                    setSelectedHistoryIds(selectedHistoryIds.filter(id => id !== record.id));
                                  }
                                }}
                              />
                            </div>
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 ml-6">
                              <img src={record.clubImage} alt={record.clubName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-sm">{record.clubName}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  record.status === '대여중' ? 'bg-amber-100 text-amber-600' :
                                  record.status === '결제완료' ? 'bg-emerald-100 text-emerald-600' :
                                  record.status === '입금대기' ? 'bg-blue-100 text-blue-600' :
                                  record.status === '반납완료' ? 'bg-slate-100 text-slate-600' :
                                  record.status === '취소됨' ? 'bg-red-100 text-red-600' :
                                  'bg-slate-100 text-slate-600'
                                }`}>{record.status}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mb-1">대여일: {record.rentalDate} ~ 반납일: {record.returnDate}</p>
                              <p className="text-[10px] text-slate-500 mb-1">배송지: {record.deliveryLocation}</p>
                              <p className="text-[10px] text-slate-500 mb-2">라운딩: {record.startTime} ~ {record.endTime}</p>
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-emerald-700">{record.totalPrice.toLocaleString()}원</p>
                                <div className="flex gap-2">
                                  {record.status === '대여중' && (
                                    <button 
                                      onClick={() => {
                                        openConfirm('예약 취소', '예약을 취소하시겠습니까? 취소된 내역은 목록에서 삭제됩니다.', () => {
                                          setRentalHistory(prev => {
                                            const newHistory = prev.map(r => 
                                              r.id === record.id 
                                              ? { ...r, status: '취소됨' as const, isDeletedByUser: true } 
                                              : r
                                            );
                                            localStorage.setItem('gr_history', JSON.stringify(newHistory));
                                            return newHistory;
                                          });
                                          setShowCancelSuccessModal(true);
                                        });
                                      }}
                                      className="text-[10px] text-red-500 font-bold border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                      예약 취소
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => {
                                      openConfirm('내역 삭제', '이 내역을 목록에서 삭제하시겠습니까? (대여 중인 경우에도 삭제 가능)', () => {
                                        setRentalHistory(prev => {
                                          const newHistory = prev.map(r => r.id === record.id ? { ...r, isDeletedByUser: true } : r);
                                          localStorage.setItem('gr_history', JSON.stringify(newHistory));
                                          return newHistory;
                                        });
                                      });
                                    }}
                                    className="text-[10px] text-slate-600 font-bold border border-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors bg-slate-50"
                                  >
                                    삭제
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Action Buttons at the bottom */}
                    {selectedHistoryIds.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-3 justify-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <button 
                          onClick={() => {
                            if (selectedHistoryIds.length === 0) return;
                            const selectedItems = rentalHistory.filter(r => selectedHistoryIds.includes(r.id));
                            const waitingItems = selectedItems.filter(r => r.status === '입금대기');
                            
                            if (waitingItems.length === 0) {
                              alert('입금대기 상태인 내역만 결제가 가능합니다.');
                              return;
                            }
                            
                            setPaymentSource('history');
                            setPaymentHistoryItems(waitingItems);
                            setShowPaymentInfo(true);
                            // Clear selection after proceeding to payment
                            setSelectedHistoryIds([]);
                          }}
                          className="flex-1 min-w-[120px] bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 px-4 py-3 rounded-xl transition-all shadow-md active:scale-95"
                        >
                          <DollarSign className="w-5 h-5" /> 선택 항목 결제하기
                        </button>
                        <button 
                          onClick={() => {
                            if (selectedHistoryIds.length === 0) return;
                            openConfirm('선택 예약 취소', '선택한 예약을 취소하시겠습니까? 취소된 내역은 목록에서 삭제됩니다.', () => {
                              setRentalHistory(prev => {
                                const updatedHistory = prev.map(r => 
                                  selectedHistoryIds.includes(r.id) 
                                  ? { ...r, status: '취소됨' as const, isDeletedByUser: true } 
                                  : r
                                );
                                localStorage.setItem('gr_history', JSON.stringify(updatedHistory));
                                return updatedHistory;
                              });
                              setSelectedHistoryIds([]);
                              setShowCancelSuccessModal(true);
                            });
                          }}
                          className="flex-1 min-w-[120px] bg-red-50 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-100 px-4 py-3 rounded-xl transition-all border border-red-200 shadow-sm active:scale-95"
                        >
                          <XCircle className="w-5 h-5" /> 선택 예약취소
                        </button>
                      </div>
                    )}
                  </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-8 py-3 flex justify-center gap-12 items-center z-40">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold">홈</span>
        </button>
        <button 
          onClick={() => setActiveTab('mypage')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'mypage' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">마이페이지</span>
        </button>
        <button 
          onClick={() => {
            if (user?.isAdmin) {
              setActiveTab('admin');
            } else {
              setShowAdminLogin(true);
            }
          }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'admin' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <ShieldCheck className="w-6 h-6" />
          <span className="text-[10px] font-bold">관리자</span>
        </button>
      </nav>

      {/* Detail Modal (Simulated) */}
      <AnimatePresence>
        {selectedClub && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedClub(null)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg rounded-t-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative h-72 bg-slate-100">
                <img 
                  src={selectedClub.image} 
                  alt={selectedClub.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setSelectedClub(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                  <ChevronRight className="w-6 h-6 rotate-90 text-slate-600" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">{selectedClub.brand}</p>
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">{selectedClub.name}</h2>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white mb-2 ${
                      selectedClub.condition === 'S' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}>
                      {selectedClub.condition} 등급
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold">{selectedClub.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-8">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 mb-1">샤프트 강도</p>
                    <p className="font-bold text-slate-700">{selectedClub.flex}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 mb-1">종류</p>
                    <p className="font-bold text-slate-700">{selectedClub.type}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 mb-1">대여 가능</p>
                    <p className="font-bold text-emerald-600">가능</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm text-slate-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-medium">JEJU RENT CLUB이 보증합니다.</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-medium">왕복 무료 배송 (문 앞 수거 서비스)</span>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">왕복 무료 배송 위치 (호텔/골프장 등)</label>
                      <input 
                        ref={deliveryRef}
                        type="text"
                        className="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="배송 받으실 위치를 입력하세요"
                        value={deliveryLocation}
                        onChange={(e) => setDeliveryLocation(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">대여 날짜</label>
                        <input 
                          ref={dateRef}
                          type="date"
                          className="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={rentalDate}
                          onChange={(e) => setRentalDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">대여 기간 (일)</label>
                        <select 
                          className="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={rentalDays}
                          onChange={(e) => setRentalDays(parseInt(e.target.value))}
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map(d => (
                            <option key={d} value={d}>{d}일</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">라운딩 시작시간</label>
                        <input 
                          ref={startRef}
                          type="time"
                          className="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">반납 시간</label>
                        <input 
                          ref={endRef}
                          type="time"
                          className="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">현재 클럽 대여 금액</p>
                      <p className="text-xl font-bold text-emerald-900">{(selectedClub.pricePerDay * rentalDays).toLocaleString()} <span className="text-sm font-normal">원</span></p>
                    </div>
                    {cart.length > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-1">장바구니 합계 ({cart.length}개)</p>
                        <p className="text-sm font-bold text-emerald-600">{(cart.reduce((s, i) => s + i.totalPrice, 0)).toLocaleString()}원</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setSelectedClub(null);
                        setActiveTab('home');
                      }}
                      className="bg-slate-100 text-slate-600 p-4 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                      title="홈으로 이동"
                    >
                      <Home className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => handleRental(selectedClub, true)}
                      className="flex-1 bg-white border-2 border-emerald-600 text-emerald-600 py-4 rounded-2xl font-bold text-sm hover:bg-emerald-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      클럽 추가하기
                    </button>
                    <button 
                      onClick={() => handleRental(selectedClub, false)}
                      className="flex-[1.5] bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
                    >
                      {cart.length > 0 ? '전체 결제하기' : '이 클럽 대여하기'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Info Modal */}
      <AnimatePresence>
        {showPaymentInfo && (paymentSource === 'cart' ? cart.length > 0 : paymentHistoryItems.length > 0) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold">입금 안내</h2>
                <p className="text-slate-400 text-sm mt-2">아래 계좌로 입금해주시면 대여가 확정됩니다.</p>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-xs font-bold text-slate-900 px-1">예약 클럽 내역</p>
                <div className="space-y-2">
                  {(paymentSource === 'cart' ? cart : paymentHistoryItems).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                      <div className="flex items-center gap-3">
                        <img src={item.clubImage} className="w-10 h-10 rounded-lg object-cover" alt="" referrerPolicy="no-referrer" />
                        <span className="text-xs font-medium text-slate-700">{item.clubName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-900">{item.totalPrice.toLocaleString()}원</span>
                        {paymentSource === 'cart' && (
                          <button 
                            onClick={() => {
                              setCart(cart.filter(c => c.id !== item.id));
                              if (cart.length === 1) setShowPaymentInfo(false);
                            }}
                            className="text-[9px] bg-red-500 text-white px-2 py-1 rounded-lg font-bold hover:bg-red-600 transition-all"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-emerald-900 p-5 rounded-2xl mb-6 text-white shadow-xl">
                <div className="flex justify-between mb-4 border-b border-emerald-800 pb-4">
                  <span className="text-xs opacity-60">총 입금 금액</span>
                  <span className="text-xl font-bold">{(paymentSource === 'cart' ? cart : paymentHistoryItems).reduce((s, i) => s + i.totalPrice, 0).toLocaleString()}원</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[10px] opacity-60">입금 계좌</span>
                    <span className="text-xs font-bold">농협 000-000-0000-00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] opacity-60">예금주</span>
                    <span className="text-xs font-bold">관리자</span>
                  </div>
                  <div className="flex justify-between border-t border-emerald-800 pt-2 mt-2">
                    <span className="text-[10px] opacity-60">관리자 연락처</span>
                    <span className="text-xs font-bold">010-5839-0119</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                  * 입금 확인 후 담당자가 전화드리겠습니다.<br/>
                  * 입금 확인 후 배송이 시작됩니다.<br/>
                  * 예약하신 라운딩 시간 1시간 전까지 배송됩니다.<br/>
                  * 대여 내역은 마이페이지에서 확인 가능합니다.
                </p>
                <button 
                  onClick={() => {
                    const itemsToPay = paymentSource === 'cart' ? cart : paymentHistoryItems;
                    const totalAmount = itemsToPay.reduce((sum, item) => sum + item.totalPrice, 0);
                    const itemsList = itemsToPay.map(item => `- ${item.clubName} (${item.totalPrice.toLocaleString()}원)`).join('\n');
                    const message = `[제주 렌트 클럽 예약 신청]\n성함: ${user?.name}\n연락처: ${user?.phone}\n\n[예약 클럽]\n${itemsList}\n\n총 금액: ${totalAmount.toLocaleString()}원\n대여일: ${itemsToPay[0].rentalDate}\n반납일: ${itemsToPay[0].returnDate}\n배송지: ${itemsToPay[0].deliveryLocation}\n라운딩시간: ${itemsToPay[0].startTime} ~ ${itemsToPay[0].endTime}\n\n입금 후 확인 부탁드립니다!`;
                    
                    const performCopy = () => {
                      copyToClipboard(message).then(() => {
                        alert('예약 내역이 복사되었습니다. 카카오톡(관리자/본인)으로 전송해주세요!');
                        window.open('https://pf.kakao.com/', '_blank');
                      }).catch(() => {
                        alert('복사에 실패했습니다. 수동으로 내용을 입력해주세요.');
                      });
                    };

                    if (navigator.share) {
                      navigator.share({
                        title: '제주 렌트 클럽 예약',
                        text: message,
                      }).catch(() => {
                        performCopy();
                      });
                    } else {
                      performCopy();
                    }
                  }}
                  className="w-full bg-[#FEE500] text-[#3c1e1e] py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm mb-3"
                >
                  <MessageCircle className="w-5 h-5" /> 카카오톡으로 전송 (관리자/본인)
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => {
                    setShowPaymentInfo(false);
                  }}
                  className="w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all flex flex-col items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-[10px]">이전 페이지</span>
                </button>
                <button 
                  onClick={() => {
                    setShowPaymentInfo(false);
                    setActiveTab('home');
                  }}
                  className="w-full bg-emerald-50 text-emerald-600 py-4 rounded-xl font-bold hover:bg-emerald-100 transition-all flex flex-col items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[10px]">클럽 추가</span>
                </button>
                <button 
                  onClick={handlePaymentConfirm}
                  className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex flex-col items-center justify-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-[10px]">확인했습니다</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">프로필 수정</h2>
                <button onClick={() => setShowEditProfile(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">이름</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-100 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={editProfileForm.name}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">전화번호</label>
                  <input 
                    type="tel"
                    className="w-full bg-slate-100 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={editProfileForm.phone}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                  />
                </div>
                <button 
                  onClick={handleUpdateProfile}
                  className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 mt-4"
                >
                  저장하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">관리자 로그인</h2>
                <button onClick={() => setShowAdminLogin(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">관리자 비밀번호</label>
                  <input 
                    type="password"
                    className="w-full bg-slate-100 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                  />
                </div>
                <button 
                  onClick={handleAdminLogin}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg mt-4"
                >
                  로그인
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {/* Cancel Success Modal */}
      <AnimatePresence>
        {showCancelSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">예약 취소 완료</h2>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                예약이 정상적으로 취소되었습니다.<br/>
                새로운 클럽을 추가로 주문하시겠습니까?
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setShowCancelSuccessModal(false);
                    setActiveTab('home');
                  }}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
                >
                  추가 주문하러 가기
                </button>
                <button 
                  onClick={() => setShowCancelSuccessModal(false)}
                  className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all active:scale-95"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
