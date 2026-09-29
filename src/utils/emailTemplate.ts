/**
 * 《VMS》书卷质感 HTML 验证码邮件模板
 * 纸墨色系：牙白底色 (#FAF7EE) + 青柠绿强调 (#70C000 / #559400)
 */
export function renderOtpEmail(code: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VMS · 研读验证码</title>
</head>
<body style="margin: 0; padding: 28px 0; background-color: #F5F5F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <div style="max-width: 480px; width: 100%; margin: 0 auto; background: #FAF7EE; border: 1px solid #E5E0D0; border-radius: 18px; padding: 36px 32px; box-sizing: border-box; text-align: left; box-shadow: 0 4px 14px rgba(0,0,0,0.04);">
          
          <!-- 顶部品牌标识 -->
          <div style="margin-bottom: 22px;">
            <div style="width: 32px; height: 32px; line-height: 32px; text-align: center; background: #70C000; color: #FFFFFF; font-weight: bold; font-size: 15px; border-radius: 8px; display: inline-block;">V</div>
            <span style="margin-left: 10px; font-size: 16px; font-weight: bold; color: #222222; vertical-align: middle; letter-spacing: 0.5px;">
              VMS · 数字花园
            </span>
            <span style="font-size: 11px; color: #888888; margin-left: 8px; vertical-align: middle; font-family: monospace;">
              250258.xyz
            </span>
          </div>

          <h1 style="font-size: 18px; font-weight: bold; color: #222222; margin: 0 0 10px 0; line-height: 1.4;">
            读者研读免密登入验证
          </h1>
          <p style="font-size: 13px; color: #666666; margin: 0 0 20px 0; line-height: 1.6;">
            您正在访问《VMS》个人数字花园。请使用以下 6 位数字验证码完成身份核验：
          </p>

          <!-- 验证码卡片 -->
          <div style="margin: 22px 0; padding: 20px; background: #FFFFFF; border-radius: 12px; text-align: center; border: 1px dashed #70C000;">
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #559400; font-family: ui-monospace, Menlo, Consolas, monospace; line-height: 1;">
              ${code}
            </div>
          </div>

          <p style="font-size: 12px; color: #888888; margin: 0 0 8px 0; line-height: 1.6;">
            ⏳ 验证码 <strong>5 分钟</strong> 内有效，连续输错 3 次将自动作废。
          </p>
          <p style="font-size: 11px; color: #AAAAAA; margin: 0; line-height: 1.6;">
            如非您本人操作，请忽略此邮件，您的账号与个人信息安全不受影响。
          </p>

          <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #EBE6D8; font-size: 11px; color: #B0A898; text-align: center;">
            纸墨装帧 · 数字漫步 · 零滚动视窗 · <a href="https://250258.xyz" style="color: #559400; text-decoration: none;">250258.xyz</a>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
