"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin, ContentReport } from "../../hooks/useAdmin";
import { useAuth } from "../../hooks/useAuth";
import { 
  ArrowLeft, 
  AlertTriangle, 
  Search, 
  Filter, 
  Eye,
  Check,
  X,
  Clock,
  User,
  MessageSquare
} from "lucide-react";
import { Button } from "../../components/ui/button";

const AdminReportsPage = () => {
  const { user, loading: isAuthLoading } = useAuth();
  const { isAdmin, isLoadingAdmin, contentReports, isLoadingReports, handleReport, isHandlingReport } = useAdmin();
  const router = useRouter();
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'investigating' | 'resolved' | 'dismissed'>('all');
  const [reasonFilter, setReasonFilter] = useState<'all' | string>('all');
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    if (!isAuthLoading && !isLoadingAdmin) {
      if (!user || !isAdmin) {
        router.push("/");
        return;
      }
    }
  }, [user, isAdmin, isAuthLoading, isLoadingAdmin, router]);

  // フィルタリング済みレポート
  const filteredReports = contentReports?.filter(report => {
    if (statusFilter !== 'all' && report.status !== statusFilter) return false;
    if (reasonFilter !== 'all' && report.report_reason !== reasonFilter) return false;
    return true;
  }) || [];

  // 統計
  const stats = {
    total: contentReports?.length || 0,
    pending: contentReports?.filter(r => r.status === 'pending').length || 0,
    investigating: contentReports?.filter(r => r.status === 'investigating').length || 0,
    resolved: contentReports?.filter(r => r.status === 'resolved').length || 0,
    dismissed: contentReports?.filter(r => r.status === 'dismissed').length || 0,
  };

  const handleReportAction = (reportId: number, status: 'investigating' | 'resolved' | 'dismissed', resolutionText?: string) => {
    handleReport({
      reportId,
      status,
      resolution: resolutionText || resolution,
    });
    setSelectedReport(null);
    setResolution('');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      investigating: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800',
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getReasonLabel = (reason: string) => {
    const labels = {
      spam: 'スパム',
      harassment: 'ハラスメント',
      hate_speech: 'ヘイトスピーチ',
      inappropriate_content: '不適切なコンテンツ',
      misinformation: 'デマ・誤情報',
      other: 'その他',
    };
    return labels[reason as keyof typeof labels] || reason;
  };

  if (isAuthLoading || isLoadingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push("/admin")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                管理者ダッシュボードに戻る
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">報告管理</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600">総報告数</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600">未処理</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600">調査中</div>
            <div className="text-2xl font-bold text-blue-600">{stats.investigating}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600">解決済み</div>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600">却下</div>
            <div className="text-2xl font-bold text-gray-600">{stats.dismissed}</div>
          </div>
        </div>

        {/* フィルタ */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">フィルタ:</span>
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">全てのステータス</option>
              <option value="pending">未処理</option>
              <option value="investigating">調査中</option>
              <option value="resolved">解決済み</option>
              <option value="dismissed">却下</option>
            </select>

            <select 
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">全ての理由</option>
              <option value="spam">スパム</option>
              <option value="harassment">ハラスメント</option>
              <option value="hate_speech">ヘイトスピーチ</option>
              <option value="inappropriate_content">不適切なコンテンツ</option>
              <option value="misinformation">デマ・誤情報</option>
              <option value="other">その他</option>
            </select>
          </div>
        </div>

        {/* 報告一覧 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              報告一覧 ({filteredReports.length}件)
            </h2>
          </div>

          {isLoadingReports ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">読み込み中...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredReports.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">報告はありません</p>
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div key={report.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(report.status)}`}>
                                {report.status === 'pending' ? '未処理' :
                                 report.status === 'investigating' ? '調査中' :
                                 report.status === 'resolved' ? '解決済み' : '却下'}
                              </span>
                              <span className="text-sm text-gray-600">
                                {getReasonLabel(report.report_reason)}
                              </span>
                              <span className="text-sm text-gray-500">
                                {report.reported_content_type === 'post' ? '投稿' : 'コメント'} ID: {report.reported_content_id}
                              </span>
                            </div>
                            
                            {report.description && (
                              <p className="text-gray-900 mb-2">{report.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(report.created_at).toLocaleString("ja-JP")}
                              </span>
                              <span>報告者: {report.reporter_user_id}</span>
                            </div>
                            
                            {report.resolution && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm font-medium text-gray-700">処理結果:</div>
                                <div className="text-sm text-gray-600 mt-1">{report.resolution}</div>
                                {report.handled_at && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(report.handled_at).toLocaleString("ja-JP")} に処理
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          詳細
                        </Button>
                        
                        {report.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReportAction(report.id, 'investigating')}
                              disabled={isHandlingReport}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              調査開始
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const reason = prompt("却下理由を入力してください:");
                                if (reason) {
                                  handleReportAction(report.id, 'dismissed', reason);
                                }
                              }}
                              disabled={isHandlingReport}
                            >
                              <X className="h-4 w-4 mr-1" />
                              却下
                            </Button>
                          </>
                        )}
                        
                        {report.status === 'investigating' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              const reason = prompt("解決内容を入力してください:");
                              if (reason) {
                                handleReportAction(report.id, 'resolved', reason);
                              }
                            }}
                            disabled={isHandlingReport}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            解決
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;