// 红蓝药丸实验后端API - 简化稳定版
let votes = [];
let voteCounts = { blue: 0, red: 0, total: 0 };

// 处理请求
module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  try {
    // 根路径 - 显示API信息
    if (pathname === '/' && req.method === 'GET') {
      return res.json({
        message: '红蓝药丸实验API',
        status: '运行正常',
        endpoints: [
          'GET  /api/stats - 获取统计数据',
          'GET  /api/votes - 获取所有投票',
          'POST /api/vote  - 提交投票'
        ],
        currentStats: {
          blue: voteCounts.blue,
          red: voteCounts.red,
          total: voteCounts.total,
          bluePercent: voteCounts.total > 0 ? Math.round((voteCounts.blue / voteCounts.total) * 100) : 0,
          redPercent: voteCounts.total > 0 ? Math.round((voteCounts.red / voteCounts.total) * 100) : 0
        }
      });
    }
    
    // 获取统计数据
    else if (pathname === '/api/stats' && req.method === 'GET') {
      const bluePercent = voteCounts.total > 0 
        ? Math.round((voteCounts.blue / voteCounts.total) * 100) 
        : 0;
      const redPercent = voteCounts.total > 0 
        ? Math.round((voteCounts.red / voteCounts.total) * 100) 
        : 0;
      
      return res.json({
        success: true,
        blue: voteCounts.blue,
        red: voteCounts.red,
        total: voteCounts.total,
        bluePercent,
        redPercent
      });
    }
    
    // 获取所有投票
    else if (pathname === '/api/votes' && req.method === 'GET') {
      const filter = url.searchParams.get('filter');
      const limit = url.searchParams.get('limit');
      
      let filteredVotes = [...votes];
      
      if (filter === 'blue' || filter === 'red') {
        filteredVotes = filteredVotes.filter(v => v.option === filter);
      }
      
      if (limit && !isNaN(parseInt(limit))) {
        filteredVotes = filteredVotes.slice(0, parseInt(limit));
      }
      
      return res.json({
        success: true,
        votes: filteredVotes,
        counts: voteCounts,
        total: votes.length
      });
    }
    
    // 提交投票
    else if (pathname === '/api/vote' && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }
      
      const data = JSON.parse(body || '{}');
      const { option, reason } = data;
      
      // 验证
      if (!option || !reason) {
        return res.status(400).json({ error: '缺少必要字段' });
      }
      
      if (option !== 'blue' && option !== 'red') {
        return res.status(400).json({ error: '选项无效' });
      }
      
      if (reason.length < 10) {
        return res.status(400).json({ error: '理由至少需要10个字' });
      }
      
      // 生成随机昵称
      const adjectives = ['勇敢', '深思', '謹慎', '樂觀', '悲觀', '理性', '感性', '好奇', '果斷', '猶豫'];
      const nouns = ['探險家', '思想家', '觀察者', '決策者', '夢想家', '現實主義者', '理想主義者', '哲學家', '科學家', '藝術家'];
      const nickname = `${adjectives[Math.floor(Math.random() * adjectives.length)]}的${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 1000)}`;
      
      const vote = {
        id: Date.now().toString(),
        userId: `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        nickname,
        option,
        reason,
        timestamp: new Date().toISOString()
      };
      
      votes.push(vote);
      voteCounts[option]++;
      voteCounts.total++;
      
      console.log(`新投票: ${option} - ${nickname}`);
      
      return res.json({
        success: true,
        message: '投票成功',
        voteId: vote.id,
        nickname
      });
    }
    
    // 其他路径返回404
    else {
      return res.status(404).json({ 
        error: '端点不存在',
        availableEndpoints: [
          'GET  /',
          'GET  /api/stats',
          'GET  /api/votes',
          'POST /api/vote'
        ]
      });
    }
    
  } catch (error) {
    console.error('服务器错误:', error);
    return res.status(500).json({ 
      error: '服务器内部错误',
      message: error.message 
    });
  }
};
