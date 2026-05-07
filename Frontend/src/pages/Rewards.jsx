import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import toast from 'react-hot-toast';
import { authService } from '../services/api';

export default function Rewards() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authService.getMe();
        setUser(res.data);
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleRedeem = (rewardName, pointsRequired) => {
    if (user?.rewardPoints >= pointsRequired) {
      toast.success(`Successfully redeemed ${rewardName}! Check your email for details.`);
      // In a real app, we would POST to an endpoint to deduct points
      setUser({ ...user, rewardPoints: user.rewardPoints - pointsRequired });
    } else {
      toast.error(`Not enough points to redeem ${rewardName}`);
    }
  };

  const rewards = [
    {
      id: 1,
      title: 'Free Coffee at Starbucks',
      description: 'Get a free tall coffee to keep you alert on the road.',
      points: 500,
      icon: 'local_cafe',
      color: 'bg-orange-100 text-orange-600'
    },
    {
      id: 2,
      title: '₹200 Fuel Voucher',
      description: 'Redeemable at any Indian Oil petrol pump.',
      points: 1500,
      icon: 'local_gas_station',
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 3,
      title: 'Premium Driver Badge',
      description: 'Unlock exclusive golden map icons and UI themes.',
      points: 2500,
      icon: 'workspace_premium',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 4,
      title: 'Free Car Wash',
      description: 'Get a premium car wash coupon for your safe driving.',
      points: 3000,
      icon: 'local_car_wash',
      color: 'bg-blue-100 text-blue-600'
    }
  ];

  if (loading) {
    return (
      <div className="bg-surface text-on-surface min-h-screen">
        <TopAppBar title="Rewards" showBack={true} onBack={() => navigate('/profile')} />
        <div className="flex-1 flex justify-center items-center h-[80vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  const currentPoints = user?.rewardPoints || 0;

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24">
      <TopAppBar title="Rewards & Redemption" showBack={true} onBack={() => navigate('/profile')} />

      <main className="pt-8 px-margin-mobile max-w-md mx-auto space-y-6">
        
        {/* Points Balance Banner */}
        <section className="bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
          <span className="material-symbols-outlined text-5xl mb-2">stars</span>
          <p className="text-label-bold font-bold uppercase tracking-widest text-primary-fixed opacity-90">Available Points</p>
          <p className="text-5xl font-extrabold mt-1 tracking-tight drop-shadow-md">{currentPoints.toLocaleString()}</p>
        </section>

        {/* Redemption Catalog */}
        <section>
          <h3 className="text-h2 font-bold mb-4">Redeem Rewards</h3>
          <div className="flex flex-col gap-4">
            {rewards.map((reward) => {
              const canRedeem = currentPoints >= reward.points;
              return (
                <div key={reward.id} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/10 flex gap-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${reward.color}`}>
                    <span className="material-symbols-outlined text-3xl">{reward.icon}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-h3 font-bold text-on-surface leading-tight">{reward.title}</h4>
                    <p className="text-caption text-on-surface-variant mt-1 mb-2">{reward.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-body-md font-bold text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">toll</span>
                        {reward.points.toLocaleString()} pts
                      </span>
                      <button 
                        onClick={() => handleRedeem(reward.title, reward.points)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                          canRedeem 
                            ? 'bg-primary text-white shadow-md hover:bg-primary-container hover:text-on-primary-container' 
                            : 'bg-surface-variant text-outline cursor-not-allowed'
                        }`}
                      >
                        {canRedeem ? 'Redeem' : 'Locked'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}
