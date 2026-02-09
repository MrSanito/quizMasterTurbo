"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import api from "@/app/lib/api";
import Loading from "@/components/Loading";
import { CheckCircle, XCircle, Trophy, BarChart2 } from "lucide-react";

export default function RoomResultPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState<any>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`/game/${roomId}/result`);
        if (res.data.success) {
          setResultData(res.data.results);
        }
      } catch (err) {
        console.error("Failed to fetch result", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [roomId]);

  if (loading) return <Loading />;
  if (!resultData) return <div className="p-10 text-center">No results found (or game not finished yet).</div>;

  // Find My Result
  const myResult = resultData.find((r: any) => r.user.id === user?.id) || resultData[0]; // Fallback to winner if viewing as guest?

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Data */}
        <div className="text-center space-y-2">
            <h1 className="text-4xl font-black text-primary">Game Results 🏆</h1>
            <p className="opacity-60">Room: {roomId}</p>
        </div>

        {/* My Score Card */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="avatar">
                            <div className="w-20 h-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                <img src={`/avatars/${myResult.user.avatar || 'avatar1.svg'}`} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{myResult.user.firstName}</h2>
                            <p className="opacity-60">@{myResult.user.username}</p>
                        </div>
                    </div>
                    <div className="stats shadow bg-base-200">
                        <div className="stat place-items-center">
                            <div className="stat-title">Rank</div>
                            <div className="stat-value text-primary">#{resultData.indexOf(myResult) + 1}</div>
                        </div>
                        <div className="stat place-items-center">
                            <div className="stat-title">Score</div>
                            <div className="stat-value">{myResult.score}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Detailed Answers */}
        <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
                <BarChart2 className="w-5 h-5"/>
                Detailed Analysis
            </h3>
            
            {myResult.answers.map((ans: any, i: number) => (
                <div key={i} className={`collapse collapse-arrow bg-base-100 border border-base-300 ${ans.isCorrect ? 'border-l-4 border-l-success' : 'border-l-4 border-l-error'}`}>
                    <input type="checkbox" /> 
                    <div className="collapse-title text-lg font-medium flex items-center justify-between pr-10">
                        <span className="flex items-center gap-3">
                             <span className="opacity-50 font-mono text-sm">Q{i+1}</span>
                             {ans.questionText}
                        </span>
                        {ans.isCorrect ? <CheckCircle className="text-success w-6 h-6"/> : <XCircle className="text-error w-6 h-6"/>}
                    </div>
                    <div className="collapse-content space-y-2 text-sm">
                        <div className="flex flex-col gap-1 p-3 bg-base-200/50 rounded-lg">
                            <span className="font-bold opacity-70">Your Answer</span>
                            <span className={`${ans.isCorrect ? 'text-success' : 'text-error'} font-semibold`}>
                                {ans.selectedOptionText || "(Skipped)"}
                            </span>
                        </div>
                        {!ans.isCorrect && (
                            <div className="flex flex-col gap-1 p-3 bg-success/10 rounded-lg border border-success/20">
                                <span className="font-bold text-success opacity-80">Correct Answer</span>
                                <span className="font-bold text-success">{ans.correctOptionText}</span>
                            </div>
                        )}
                        <div className="text-xs opacity-50 pt-2 text-right">
                            Points: {ans.points > 0 ? `+${ans.points}` : ans.points}
                        </div>
                    </div>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
}
