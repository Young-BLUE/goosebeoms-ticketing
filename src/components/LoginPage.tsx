import { useState } from 'react';
import { ArrowLeft, Mail, Lock, User as UserIcon, Phone } from 'lucide-react';
import type {User} from "../models/ticket-model.ts";

interface LoginPageProps {
    onLogin: (user: User) => void;
    onBack: () => void;
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isSignUp) {
            if (!name || !email || !password || !phone) {
                alert('모든 필드를 입력해주세요');
                return;
            }
            onLogin({ name, email, phone });
        } else {
            if (!email || !password) {
                alert('이메일과 비밀번호를 입력해주세요');
                return;
            }
            if (email === 'admin@admin.com' && password === 'admin') {
                // Demo login
                onLogin({
                    name: email.split('@')[0],
                    email,
                    phone: '010-1234-5678'
                });
            } else {
                alert('로그인 정보를 확인하세요');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 sm:mb-8 text-sm sm:text-base"
                >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>뒤로가기</span>
                </button>

                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-3 sm:mb-4">
                            <UserIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <h1 className="text-gray-900 mb-2 text-xl sm:text-2xl md:text-3xl">
                            {isSignUp ? '회원가입' : '로그인'}
                        </h1>
                        <p className="text-gray-600 text-sm sm:text-base">
                            {isSignUp
                                ? '뮤지컬 티켓의 새로운 회원이 되어보세요'
                                : '뮤지컬 티켓에 오신 것을 환영합니다'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                        {isSignUp && (
                            <>
                                <div>
                                    <label className="block text-xs sm:text-sm text-gray-700 mb-2">이름</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="홍길동"
                                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm text-gray-700 mb-2">전화번호</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="010-1234-5678"
                                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-xs sm:text-sm text-gray-700 mb-2">이메일</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@email.com"
                                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm text-gray-700 mb-2">비밀번호</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        {!isSignUp && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm">
                                <label className="flex items-center gap-2 text-gray-600">
                                    <input type="checkbox" className="rounded" />
                                    <span>로그인 상태 유지</span>
                                </label>
                                <a href="#" className="text-purple-600 hover:text-purple-700">
                                    비밀번호 찾기
                                </a>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all text-sm sm:text-base"
                        >
                            {isSignUp ? '회원가입' : '로그인'}
                        </button>
                    </form>

                    <div className="mt-4 sm:mt-6 text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-xs sm:text-sm text-gray-600 hover:text-gray-900"
                        >
                            {isSignUp ? (
                                <>
                                    이미 계정이 있으신가요?{' '}
                                    <span className="text-purple-600">로그인</span>
                                </>
                            ) : (
                                <>
                                    계정이 없으신가요?{' '}
                                    <span className="text-purple-600">회원가입</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                        <p className="text-center text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                            간편 로그인
                        </p>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <button className="py-2.5 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm">
                                <span className="text-yellow-500">카카오</span>
                            </button>
                            <button className="py-2.5 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm">
                                <span className="text-green-500">네이버</span>
                            </button>
                            <button className="py-2.5 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm">
                                <span className="text-gray-700">Google</span>
                            </button>
                        </div>
                    </div>
                </div>

                {isSignUp && (
                    <div className="mt-4 sm:mt-6 bg-white/70 backdrop-blur rounded-xl p-3 sm:p-4">
                        <p className="text-xs text-gray-600 text-center">
                            회원가입 시{' '}
                            <a href="#" className="text-purple-600">
                                이용약관
                            </a>{' '}
                            및{' '}
                            <a href="#" className="text-purple-600">
                                개인정보처리방침
                            </a>
                            에 동의하게 됩니다.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
