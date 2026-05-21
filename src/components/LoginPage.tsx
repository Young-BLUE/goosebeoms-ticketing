import { useState } from 'react';
import { ArrowLeft, Mail, Lock, User as UserIcon, Phone } from 'lucide-react';
import { login, signup } from '../api/auth';
import type { AuthUser } from '../contexts/AppContexts';

interface LoginPageProps {
  onLogin: (token: string, user: AuthUser) => void;
  onBack: () => void;
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let res;
      if (isSignUp) {
        if (!name || !email || !password) {
          setError('이름, 이메일, 비밀번호를 입력해주세요');
          return;
        }
        if (password.length < 8) {
          setError('비밀번호는 8자 이상이어야 합니다');
          return;
        }
        res = await signup({ email, password, name, phone: phone || undefined });
      } else {
        res = await login(email, password);
      }
      onLogin(res.token, { email: res.email, name: res.name, role: res.role });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? '요청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
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
                ? 'Goosebeoms Ticket의 새로운 회원이 되어보세요'
                : 'Goosebeoms Ticket에 오신 것을 환영합니다'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all text-sm sm:text-base disabled:opacity-60"
            >
              {loading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
            </button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
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
        </div>
      </div>
    </div>
  );
}
