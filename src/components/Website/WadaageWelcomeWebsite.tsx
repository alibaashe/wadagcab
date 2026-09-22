import React from 'react';
import {
  Download, Smartphone, Car, Shield, Globe, MessageSquare,
  ArrowRight, CheckCircle2, Apple, MapPin, Phone, Users,
  CreditCard, Sparkles, Navigation, Clock
} from 'lucide-react';
import { SomalilandFlag } from '../Common/SomalilandFlag';
import { WadaageLogo } from '../Common/WadaageLogo';

interface WadaageWelcomeWebsiteProps {
  onNavigate: (target: 'rider' | 'driver' | 'admin' | 'website') => void;
  language: 'so' | 'en';
  setLanguage: (lang: 'so' | 'en') => void;
}

export const WadaageWelcomeWebsite: React.FC<WadaageWelcomeWebsiteProps> = ({
  onNavigate,
  language,
  setLanguage,
}) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* 1. TOP NOTICE & LANGUAGE STRIP */}
      <div className="bg-blue-900 text-white py-2 px-4 text-xs font-semibold border-b border-blue-800">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SomalilandFlag className="w-4 h-2.5 rounded-xs" />
            <span className="font-bold">
              {language === 'so'
                ? 'Wadaage Somaliland — Gaadiid Casri ah & Qiimo Jaban'
                : 'Wadaage Somaliland — Smart Mobility & Affordable Rides'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://wa.me/252636807814"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center space-x-1.5 text-blue-200 hover:text-white font-bold transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp: +252 63 6807814</span>
            </a>

            <button
              onClick={() => setLanguage(language === 'en' ? 'so' : 'en')}
              className="bg-blue-800 hover:bg-blue-700 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white flex items-center space-x-1.5 transition border border-blue-700"
            >
              <Globe className="w-3 h-3 text-blue-300" />
              <span>{language === 'en' ? 'SOMALI' : 'ENGLISH'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVBAR */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <WadaageLogo variant="badge" size="sm" />
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-2xl font-black text-blue-900 tracking-tight">
                  Wadaage
                </span>
                <span className="text-2xl font-black text-blue-600">.com</span>
              </div>
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                Somaliland Smart Mobility
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-bold text-slate-600">
            <a href="#about" className="hover:text-blue-600 transition">
              {language === 'so' ? 'Faahfaahin' : 'About'}
            </a>
            <a href="#features" className="hover:text-blue-600 transition">
              {language === 'so' ? 'Astaamaha' : 'Features'}
            </a>
            <a href="#download" className="hover:text-blue-600 transition">
              {language === 'so' ? 'Download App' : 'Download'}
            </a>
            <a href="#contact" className="hover:text-blue-600 transition">
              {language === 'so' ? 'La Xiriir' : 'Contact'}
            </a>
          </nav>

          {/* Direct Ride Booking CTA Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('rider')}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-md hover:shadow-blue-500/25 transition flex items-center space-x-2"
            >
              <Car className="w-4 h-4 text-blue-200" />
              <span>{language === 'so' ? 'Dalbo Wadaage' : 'Book a Ride'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-white py-12 sm:py-20 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {language === 'so'
                    ? 'Adeegga Gaadiidka ee Koowaad ee Somaliland'
                    : '#1 Smart Mobility Platform in Somaliland'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                {language === 'so' ? (
                  <>
                    Safarkaaga Hargeysa, Si Fudud & <span className="text-blue-600">Qiimo Jaban</span>
                  </>
                ) : (
                  <>
                    Your Commute in Hargeisa, Fast & <span className="text-blue-600">Affordable</span>
                  </>
                )}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
                {language === 'so'
                  ? 'Ku safar Wadaage Share si aad u wadaagto kharashka, ama kireyso Taxi gaar ah. Degdeg, ammaan, iyo lacag-bixinta tooska ah ee ZAAD iyo eDahab.'
                  : 'Travel with Wadaage Share to split costs with fellow commuters, or hire a private Taxi across Hargeisa with direct ZAAD & eDahab mobile payments.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <a
                  href="#download"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-7 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 transition active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>{language === 'so' ? 'Soo Degso App-ka' : 'Download Mobile App'}</span>
                </a>

                <button
                  onClick={() => onNavigate('rider')}
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 text-blue-900 border-2 border-blue-200 hover:border-blue-400 px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition active:scale-98 shadow-xs"
                >
                  <span>{language === 'so' ? 'Kaga Safar Web-ka' : 'Book on Web'}</span>
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                </button>
              </div>

              {/* Trust Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <div className="text-2xl font-black text-blue-900">1.0 KM</div>
                  <div className="text-xs text-slate-500 font-semibold">{language === 'so' ? 'Imaanshaha Darawalka' : 'Average Dispatch'}</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-blue-900">100%</div>
                  <div className="text-xs text-slate-500 font-semibold">{language === 'so' ? 'ZAAD & eDahab' : 'Mobile Payments'}</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-blue-900">24/7</div>
                  <div className="text-xs text-slate-500 font-semibold">{language === 'so' ? 'Adeeg Joogto ah' : 'Active Fleet'}</div>
                </div>
              </div>
            </div>

            {/* Right Visual: Mobile Showcase */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[320px] bg-slate-950 rounded-[44px] p-3.5 shadow-2xl border-4 border-slate-800 ring-1 ring-blue-500/20">
                {/* Speaker Ear Notch */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-slate-800 mr-2" />
                  <div className="w-8 h-1.5 bg-slate-700 rounded-full" />
                </div>

                {/* Smartphone Screen Inside */}
                <div className="w-full bg-slate-900 rounded-[34px] overflow-hidden pt-8 pb-4 text-white text-xs">
                  {/* Top Bar inside mockup */}
                  <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-[10px] font-black">W</div>
                      <span className="font-bold text-white text-xs">Wadaage Rider</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                      Live GPS
                    </span>
                  </div>

                  {/* Mockup Map Area */}
                  <div className="h-44 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
                    {/* Pulsing pickup point */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center animate-ping absolute" />
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg font-bold">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold bg-slate-900 px-2 py-0.5 rounded-md mt-1 border border-slate-700">
                        Jigjiga Yar
                      </span>
                    </div>
                  </div>

                  {/* Mockup Card Bottom */}
                  <div className="p-4 space-y-3 bg-slate-950">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Halka aad tegeyso</span>
                      <span className="text-blue-400 font-bold">Total Kaalinta</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="font-bold text-white text-xs">Wadaage Share</div>
                          <div className="text-[10px] text-slate-400">3 kuraas banaan</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-400 text-xs">$0.90 USD</div>
                        <div className="text-[9px] text-slate-400">7,650 SLSH</div>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate('rider')}
                      className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-md"
                    >
                      Dalbo Hadda (Book Ride)
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. BLUE STATS STRIP */}
      <section className="bg-blue-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-blue-200">10,000+</div>
              <div className="text-xs font-bold text-blue-100 uppercase tracking-wider">
                {language === 'so' ? 'Safarro Guulaystay' : 'Completed Trips'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-blue-200">1.0 KM</div>
              <div className="text-xs font-bold text-blue-100 uppercase tracking-wider">
                {language === 'so' ? 'Dispatch Degdeg ah' : 'Dispatch Radius'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-blue-200">100%</div>
              <div className="text-xs font-bold text-blue-100 uppercase tracking-wider">
                {language === 'so' ? 'Xaqiijinta Darawalka' : 'Verified Drivers'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-blue-200">24 / 7</div>
              <div className="text-xs font-bold text-blue-100 uppercase tracking-wider">
                {language === 'so' ? 'Taageero Toos ah' : 'Live Support'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CORE FEATURES SECTION (BLUE & WHITE CARDS) */}
      <section id="features" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">

          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {language === 'so' ? 'Maxaad Wadaage u Dooranaysaa?' : 'Why Choose Wadaage?'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              {language === 'so'
                ? 'Waxaan kuu keenay tiknoolajiyad casri ah oo fududaynaysa safarkaaga maalinlaha ah ee caasimadda Hargeysa.'
                : 'Modern technology crafted for Somaliland, making your daily transportation safe, fast, and economical.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                {language === 'so' ? 'Qiimo Jaban & Hufan' : 'Affordable & Transparent'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'so'
                  ? 'Kharashka safarka oo 40% ka jaban tagsiyada kale. Qiimo go\'an oo cad kahor intaadan kicin gaadhiga.'
                  : 'Fares are up to 40% lower with upfront transparent pricing before you confirm your ride.'}
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                {language === 'so' ? 'Wada Safar (Carpool)' : 'Wadaage Share Carpooling'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'so'
                  ? 'La wadaag kuraasta dadka isla jihada u socda si aad u yarayso kharashka iyo ciriiriga wadooyinka.'
                  : 'Split the cost by sharing empty seats with passengers heading the same route across Hargeisa.'}
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                {language === 'so' ? 'Ammaan & Kalsooni' : 'Safe & Verified Drivers'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'so'
                  ? 'Dhammaan darawallada waxay leeyihiin Dammaanad-qaade rasmi ah, Baasaboor/ID Somaliland, iyo Gaadhi la hubiyey.'
                  : 'All drivers undergo strict vetting with Somaliland National ID, police record, and verified local guarantor.'}
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Navigation className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                {language === 'so' ? 'Raad-raaca Tooska ah' : 'Live GPS & Route Tracking'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'so'
                  ? 'Kala soco gaadhigaaga khariidadda tooska ah. La wadaag qoyskaaga safarkaaga si aad ugu nabad gasho.'
                  : 'Real-time live map tracking allows you to see your vehicle approach and share trip details with family.'}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. DOWNLOAD APPS SECTION (RIDER & DRIVER) */}
      <section id="download" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">

          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold border border-blue-200">
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'so' ? 'Kala Soo Deg App-ka Rasmiga ah' : 'Official Application Downloads'}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {language === 'so' ? (
                <>Dooro App-kaaga oo <span className="text-blue-600">Hadda Soo Degso</span></>
              ) : (
                <>Select Your App & <span className="text-blue-600">Download Now</span></>
              )}
            </h2>

            <p className="text-sm sm:text-base text-slate-600">
              {language === 'so'
                ? 'App-ka Rakaabka (Wadaage Rider) ama App-ka Darawalka (Wadaage Driver) oo diyaar u ah Android iyo iOS.'
                : 'Standalone applications available on Google Play, Apple App Store, and direct APK download.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* CARD 1: RIDER APP */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-300 shadow-lg flex flex-col justify-between hover:border-blue-600 transition">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl p-1 bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center shrink-0 shadow-md">
                    <img
                      src="/riderlogo.png"
                      alt="Wadaage Rider"
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/riderlogo.jpg';
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {language === 'so' ? 'Rakaabka' : 'Rider'}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">Wadaage Rider</h3>
                    <p className="text-xs text-slate-500 font-medium">Dalbo Taxi & Wadaage Share</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {language === 'so'
                    ? 'App-ka rasmiga ah ee aad ku dalbanayso gaadiidka Hargeysa. Bixi lacagta toos ZAAD iyo eDahab.'
                    : 'The official passenger application to request private taxis and shared rides in Hargeisa with ZAAD & eDahab.'}
                </p>

                <div className="space-y-1.5 text-xs text-slate-700 font-semibold pt-1">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{language === 'so' ? 'Gaadhi Wadaag & Taxi Hargeysa' : 'City Rides & Carpooling'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{language === 'so' ? 'Telesom ZAAD & Somtel eDahab' : 'Instant ZAAD & eDahab Payments'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-6 border-t border-slate-100 mt-6">
                <a
                  href="https://play.google.com/store/apps/details?id=com.wadaage.rider"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-3 transition shadow"
                >
                  <svg className="w-4 h-4 fill-current text-sky-400" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a2.41 2.41 0 0 1-.61-.715 2.455 2.455 0 0 1-.225-1.077V3.606c0-.395.078-.767.225-1.077.147-.31.36-.558.61-.715zm11.233 11.236l2.373 2.374-12.01 6.942 9.637-9.316zm0-2.1L5.205 1.634l12.01 6.942-2.373 2.374zm1.485 1.05l3.896 2.253a1.44 1.44 0 0 1 0 2.494l-3.896 2.253-2.122-2.123 2.122-2.877z" />
                  </svg>
                  <span>Google Play (Rider)</span>
                </a>

                <a
                  href="https://apps.apple.com/app/wadaage-rider/id6470000001"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-3 transition shadow"
                >
                  <Apple className="w-4 h-4 text-white" />
                  <span>Apple App Store (Rider)</span>
                </a>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href="/wadaage-rider.apk"
                    download
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center justify-center space-x-1 transition text-center"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Direct APK</span>
                  </a>
                  <button
                    onClick={() => onNavigate('rider')}
                    className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg flex items-center justify-center space-x-1 transition text-center"
                  >
                    <span>Furo Web</span>
                    <ArrowRight className="w-3 h-3 text-blue-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 2: DRIVER APP */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-300 shadow-lg flex flex-col justify-between hover:border-blue-600 transition">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl p-1 bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center shrink-0 shadow-md">
                    <img
                      src="/darwelllogo.png"
                      alt="Wadaage Driver"
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/darwelllogo.jpg';
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {language === 'so' ? 'Darawallada' : 'Driver Partner'}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">Wadaage Driver</h3>
                    <p className="text-xs text-slate-500 font-medium">Kaxee & Dakhli Sameyso</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {language === 'so'
                    ? 'App-ka darawallada ku biiraya kooxda Wadaage si ay u helaan dalabyo maalinle ah iyo lacag toos ah.'
                    : 'The partner app for licensed drivers to receive trip dispatches, navigate routes, and cash out earnings.'}
                </p>

                <div className="space-y-1.5 text-xs text-slate-700 font-semibold pt-1">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{language === 'so' ? 'Dakhli maalinle ah oo degdeg ah' : 'Daily Payouts via ZAAD & eDahab'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{language === 'so' ? 'Navigation toos ah oo GPS ah' : 'Live GPS Navigation & Safety'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-6 border-t border-slate-100 mt-6">
                <a
                  href="https://play.google.com/store/apps/details?id=com.wadaage.driver"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-3 transition shadow"
                >
                  <svg className="w-4 h-4 fill-current text-sky-400" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a2.41 2.41 0 0 1-.61-.715 2.455 2.455 0 0 1-.225-1.077V3.606c0-.395.078-.767.225-1.077.147-.31.36-.558.61-.715zm11.233 11.236l2.373 2.374-12.01 6.942 9.637-9.316zm0-2.1L5.205 1.634l12.01 6.942-2.373 2.374zm1.485 1.05l3.896 2.253a1.44 1.44 0 0 1 0 2.494l-3.896 2.253-2.122-2.123 2.122-2.877z" />
                  </svg>
                  <span>Google Play (Driver)</span>
                </a>

                <a
                  href="https://apps.apple.com/app/wadaage-driver/id6470000002"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-3 transition shadow"
                >
                  <Apple className="w-4 h-4 text-white" />
                  <span>Apple App Store (Driver)</span>
                </a>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href="/wadaage-driver.apk"
                    download
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center justify-center space-x-1 transition text-center"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Direct APK</span>
                  </a>
                  <button
                    onClick={() => onNavigate('driver')}
                    className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg flex items-center justify-center space-x-1 transition text-center"
                  >
                    <span>Furo Web</span>
                    <ArrowRight className="w-3 h-3 text-blue-600" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. CONTACT & SUPPORT SECTION */}
      <section id="contact" className="py-12 sm:py-16 bg-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center mx-auto md:mx-0 text-blue-200">
                <Phone className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-base">{language === 'so' ? 'Kala Xiriir Khadka' : 'Phone Contact'}</h4>
              <p className="text-xs text-blue-200">+252 63 6807814</p>
              <p className="text-xs text-blue-200">+252 65 6807814</p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center mx-auto md:mx-0 text-blue-200">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="font-extrabold text-base">WhatsApp Support</h4>
              <p className="text-xs text-blue-200">+252 63 6807814 (24/7)</p>
              <a
                href="https://wa.me/252636807814"
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs font-bold text-emerald-400 hover:underline"
              >
                Fariin Toos ah U Dir →
              </a>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center mx-auto md:mx-0 text-blue-200">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-base">{language === 'so' ? 'Xafiiska Dhexe' : 'Headquarters'}</h4>
              <p className="text-xs text-blue-200">Jigjiga Yar Commercial District</p>
              <p className="text-xs text-blue-200">Hargeisa, Somaliland</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CLEAN OFFICIAL FOOTER (NO ADMIN/DRIVER LINKS) */}
      <footer className="bg-slate-950 text-slate-400 py-8 px-4 sm:px-6 text-xs border-t border-slate-900">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center space-x-2.5">
            <WadaageLogo variant="badge" size="xs" />
            <span className="font-bold text-white">Wadaage Mobility Somaliland</span>
            <span>•</span>
            <span>© 2026 All Rights Reserved</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400 font-medium">
            <span className="text-slate-500">Hargeisa, Somaliland</span>
            <span>•</span>
            <a href="mailto:info@wadaage.com" className="hover:text-white transition">
              info@wadaage.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
