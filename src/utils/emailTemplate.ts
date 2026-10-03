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

/**
 * 《VMS》账号注册激活邮件模板
 * 纸墨色系：牙白底色 (#FAF7EE) + 青柠绿强调 (#70C000 / #559400)
 */
export function renderActivationEmail(params: {
  nickname: string;
  email: string;
  activationUrl: string;
  expiresInHours?: number;
}): string {
  const { nickname, email, activationUrl, expiresInHours = 24 } = params;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VMS · 激活您的数字花园账号</title>
</head>
<body style="margin: 0; padding: 32px 0; background-color: #F5F5F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Noto Serif SC', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <div style="max-width: 520px; width: 100%; margin: 0 auto; background: #FAF7EE; border: 1px solid #E5E0D0; border-radius: 20px; padding: 40px 36px; box-sizing: border-box; text-align: left; box-shadow: 0 6px 18px rgba(0,0,0,0.04);">
          
          <!-- 顶部品牌标识 -->
          <div style="margin-bottom: 26px;">
            <div style="width: 34px; height: 34px; line-height: 34px; text-align: center; background: #70C000; color: #FFFFFF; font-weight: bold; font-size: 16px; border-radius: 9px; display: inline-block;">V</div>
            <span style="margin-left: 12px; font-size: 17px; font-weight: 900; color: #1C1917; vertical-align: middle; letter-spacing: 0.5px;">
              VMS
            </span>
            <span style="font-size: 11px; color: #78716C; margin-left: 8px; vertical-align: middle; font-family: monospace; background: #EDE8D8; padding: 2px 6px; border-radius: 6px;">
              250258.xyz
            </span>
          </div>

          <h1 style="font-size: 20px; font-weight: bold; color: #1C1917; margin: 0 0 14px 0; line-height: 1.4;">
            开启您的数字花园研读之门
          </h1>
          <p style="font-size: 14px; color: #44403C; margin: 0 0 16px 0; line-height: 1.7;">
            尊敬的 <strong>${nickname}</strong>（<span style="color: #78716C; font-family: monospace;">${email}</span>）：
          </p>
          <p style="font-size: 13px; color: #57534E; margin: 0 0 24px 0; line-height: 1.7;">
            感谢您注册《VMS》个人数字花园。请点击下方按钮完成邮箱验证并激活您的账号，激活后您即可使用账号密码随时漫步林泉、研读长文与发表书卷批注：
          </p>

          <!-- 激活按钮区域 -->
          <div style="margin: 30px 0; text-align: center;">
            <a href="${activationUrl}" target="_blank" style="display: inline-block; background-color: #70C000; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 36px; border-radius: 12px; box-shadow: 0 2px 8px rgba(112, 192, 0, 0.3); letter-spacing: 0.5px;">
              点击激活账号并漫步花园 &rarr;
            </a>
          </div>

          <!-- 备用文本链接 -->
          <div style="background: #FFFFFF; border: 1px solid #E7E2D2; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px;">
            <p style="font-size: 11px; color: #78716C; margin: 0 0 6px 0; line-height: 1.5;">
              若上方按钮无法点击，请复制以下链接粘贴到浏览器地址栏访问：
            </p>
            <p style="font-size: 11px; color: #559400; word-break: break-all; margin: 0; font-family: monospace; line-height: 1.5;">
              <a href="${activationUrl}" style="color: #559400; text-decoration: underline;">${activationUrl}</a>
            </p>
          </div>

          <p style="font-size: 12px; color: #A8A29E; margin: 0 0 8px 0; line-height: 1.6;">
            ⏳ 该激活链接在 <strong>${expiresInHours} 小时</strong> 内有效。
          </p>
          <p style="font-size: 11px; color: #A8A29E; margin: 0; line-height: 1.6;">
            如非您本人发起的注册操作，请忽略此邮件，您的邮箱不会被绑定。
          </p>

          <div style="margin-top: 32px; padding-top: 18px; border-top: 1px solid #EBE6D8; font-size: 11px; color: #A8A29E; text-align: center;">
            纸墨装帧 · 对开慢读 · 零滚动视窗 · <a href="https://250258.xyz" style="color: #559400; text-decoration: none;">250258.xyz</a>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
