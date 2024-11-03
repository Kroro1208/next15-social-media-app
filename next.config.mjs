
const nextConfig = {
  /* config options here */
  experimental: {
    staleTimes: { // キャッシュの有効期限を設定
      dynamic: 30 // 動的ルートのキャッシュ時間を30秒に設定
    }
  }
};

export default nextConfig;
