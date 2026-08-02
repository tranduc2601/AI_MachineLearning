import db from '../config/db.js';

export const getMetrics = (req, res) => {
  db.all('SELECT * FROM Run_Metrics ORDER BY timestamp ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch analytics metrics' });
    }

    // Xử lý fallback an toàn nếu chưa có bản ghi đánh giá nào (bảng trống)
    if (!rows || rows.length === 0) {
      return res.json({
        latest_confusion_matrix: { tp: 0, fp: 0, tn: 0, fn: 0 },
        history: []
      });
    }

    // Lấy ra bản ghi đánh giá mới nhất (nằm ở cuối mảng vì order by ASC)
    const latestRow = rows[rows.length - 1];

    res.json({
      latest_confusion_matrix: {
        tp: latestRow.tp || 0,
        fp: latestRow.fp || 0,
        tn: latestRow.tn || 0,
        fn: latestRow.fn || 0
      },
      history: rows
    });
  });
};
