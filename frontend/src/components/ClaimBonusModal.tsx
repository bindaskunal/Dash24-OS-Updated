import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useUserStore } from "../store/useUserStore";

interface ClaimBonusModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'PHONE_INPUT' | 'OTP_INPUT' | 'SUCCESS';

export default function ClaimBonusModal({ isOpen, onClose }: ClaimBonusModalProps) {
    const router = useRouter();
    const setAuthenticated = useUserStore(state => state.setAuthenticated);
    const setPulsePoints = useUserStore(state => state.setPulsePoints);

    const [step, setStep] = useState<Step>('PHONE_INPUT');
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('PHONE_INPUT');
            setPhone('');
            setOtp('');
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSendOtp = async () => {
        setError(null);
        if (phone.length !== 10) {
            setError("Please enter a valid 10-digit number.");
            return;
        }

        setIsLoading(true);

        const { error } = await supabase.auth.signInWithOtp({
            phone: '+91' + phone,
        });

        setIsLoading(false);

        if (error) {
            setError(error.message);
        } else {
            setStep('OTP_INPUT');
        }
    };

    const handleVerifyOtp = async () => {
        setError(null);
        if (otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP.");
            return;
        }

        setIsLoading(true);

        const { error } = await supabase.auth.verifyOtp({
            phone: '+91' + phone,
            token: otp,
            type: 'sms',
        });

        setIsLoading(false);

        if (error) {
            setError(error.message);
        } else {
            setStep('SUCCESS');
            setPulsePoints(500);
            setAuthenticated(true);
            
            // Auto close after showing success and redirect
            setTimeout(() => {
                onClose();
                router.push('/');
            }, 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative animate-in slide-in-from-bottom-8 duration-300">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xl leading-none pb-1"
                >
                    &times;
                </button>

                {step === 'PHONE_INPUT' && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
                            🎁
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Claim Your ₹500</h3>
                        <p className="text-slate-500 text-sm mb-8">Enter your mobile number to instantly lock in your welcome bonus and register.</p>

                        <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mb-4 focus-within:border-[#00FF41] focus-within:ring-2 focus-within:ring-[#00FF41]/20 transition-all">
                            <div className="px-4 py-4 bg-slate-100 text-slate-500 font-bold border-r border-slate-200 flex items-center">
                                +91
                            </div>
                            <input
                                type="tel"
                                maxLength={10}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                placeholder="Mobile Number"
                                className="w-full px-4 py-4 bg-transparent outline-none font-mono text-gray-900 placeholder:font-sans placeholder:text-slate-400"
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm font-medium mb-4">{error}</p>}

                        <button 
                            onClick={handleSendOtp}
                            disabled={isLoading || phone.length !== 10}
                            className={`w-full py-4 rounded-xl font-black uppercase tracking-wide transition-all ${
                                isLoading || phone.length !== 10 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#00FF41] text-gray-900 hover:bg-emerald-400 shadow-[0_0_20px_rgba(0,255,65,0.3)]'
                            }`}
                        >
                            {isLoading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </div>
                )}

                {step === 'OTP_INPUT' && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
                            🔐
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Verify Number</h3>
                        <p className="text-slate-500 text-sm mb-8">We've sent a 6-digit code to <span className="font-bold text-gray-900">+91 {phone}</span>.</p>

                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="w-full px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#00FF41] focus:ring-2 focus:ring-[#00FF41]/20 transition-all mb-4 placeholder:text-slate-300"
                        />

                        {error && <p className="text-red-500 text-sm font-medium mb-4">{error}</p>}

                        <button 
                            onClick={handleVerifyOtp}
                            disabled={isLoading || otp.length !== 6}
                            className={`w-full py-4 rounded-xl font-black uppercase tracking-wide transition-all ${
                                isLoading || otp.length !== 6 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#00FF41] text-gray-900 hover:bg-emerald-400 shadow-[0_0_20px_rgba(0,255,65,0.3)]'
                            }`}
                        >
                            {isLoading ? 'Verifying...' : 'Secure Account'}
                        </button>
                    </div>
                )}

                {step === 'SUCCESS' && (
                    <div className="text-center py-8">
                        <div className="w-24 h-24 bg-[#00FF41] rounded-full flex items-center justify-center text-white text-5xl mb-6 mx-auto shadow-[0_0_40px_rgba(0,255,65,0.4)] animate-bounce font-black pb-2">
                            ✓
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 mb-2">₹500 Secured!</h3>
                        <p className="text-slate-500">Your Pulse Wallet is now active. Enjoy seamless 10-min delivery.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
