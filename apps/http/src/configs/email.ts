const BASE_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { 
    background-color: #0b0c10; 
    color: #f1f3f9; 
    -webkit-text-size-adjust: 100%; 
    -ms-text-size-adjust: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }
  table { border-collapse: collapse; }
  .wrapper { width: 100%; background-color: #0b0c10; padding: 40px 10px; }
  .container { 
    width: 100%; 
    max-width: 540px; 
    background: rgba(22, 24, 33, 0.95); 
    border: 1px solid rgba(255, 255, 255, 0.06); 
    border-radius: 24px; 
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
  }
  .card-body { padding: 48px 36px; }
  .accent-bar { 
    width: 48px; 
    height: 4px; 
    background: linear-gradient(90deg, #3b82f6, #8b5cf6); 
    border-radius: 2px; 
    margin-bottom: 32px; 
  }
  .brand { 
    font-size: 12px; 
    letter-spacing: 4px; 
    text-transform: uppercase;
    color: #3b82f6; 
    margin-bottom: 24px; 
    font-weight: 700;
  }
  .title { 
    font-size: 26px; 
    color: #ffffff; 
    font-weight: 700;
    margin-bottom: 16px; 
    line-height: 1.25;
    letter-spacing: -0.5px;
  }
  .body-text { 
    font-size: 15px; 
    color: rgba(241, 243, 249, 0.7); 
    line-height: 1.6; 
    margin-bottom: 36px; 
  }
  .otp-row { margin: 32px 0; }
  .otp-wrap { display: inline-flex; align-items: center; gap: 8px; }
  .otp-digit { 
    display: inline-block; 
    width: 48px; 
    height: 56px; 
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08); 
    border-radius: 12px; 
    text-align: center;
    line-height: 54px; 
    font-size: 26px; 
    font-weight: 800; 
    color: #3b82f6;
    font-family: 'SF Mono', Consolas, Menlo, monospace;
  }
  .otp-sep { 
    display: inline-block; 
    width: 12px; 
    height: 2px; 
    background: rgba(255, 255, 255, 0.15);
    vertical-align: middle; 
    margin: 0 4px; 
  }
  .muted { 
    font-size: 13px; 
    color: rgba(241, 243, 249, 0.45); 
    line-height: 1.6; 
    margin-bottom: 8px; 
  }
  .muted-accent { color: #8b5cf6; font-weight: 600; }
  .divider { 
    height: 1px; 
    background: rgba(255, 255, 255, 0.08); 
    margin: 36px 0 24px 0; 
  }
  .footer { 
    font-size: 11px; 
    color: rgba(241, 243, 249, 0.3); 
    letter-spacing: 0.5px; 
    text-align: center; 
  }
  .btn { 
    display: inline-block; 
    background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
    border: none;
    border-radius: 12px;
    padding: 14px 32px; 
    font-size: 15px; 
    font-weight: 600;
    color: #ffffff !important; 
    letter-spacing: 0.2px; 
    text-decoration: none;
    box-shadow: 0 10px 20px rgba(59, 130, 246, 0.25);
    transition: all 0.2s ease;
  }
  .link { 
    font-size: 12px; 
    color: rgba(139, 92, 246, 0.8); 
    word-break: break-all;
    font-family: 'SF Mono', Consolas, Menlo, monospace; 
    text-decoration: none; 
  }
  @media only screen and (max-width:600px) {
    .container { border-radius: 16px!important; }
    .card-body { padding: 32px 20px!important; }
    .otp-digit { width: 40px!important; height: 48px!important; font-size: 22px!important; line-height: 46px!important; border-radius: 8px!important; }
  }
`;

export const getOtpHtml = ({ email, otp }: any) => {
  const digits = String(otp).split("").map(
    (d) => `<td><span class="otp-digit">${d}</span></td>`
  );
  const mid = Math.ceil(digits.length / 2);
  const firstHalf = digits.slice(0, mid).join("");
  const secondHalf = digits.slice(mid).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>Your verification code</title>
<style>${BASE_STYLES}</style>
</head>
<body>
<table role="presentation" class="wrapper" width="100%" border="0" cellspacing="0" cellpadding="0">
<tr><td align="center">
  <table role="presentation" class="container" border="0" cellspacing="0" cellpadding="0">
  <tr><td class="card-body">

    <div class="accent-bar"></div>
    <p class="brand">QuizMaster</p>
    <h1 class="title">Verify your email</h1>
    <p class="body-text">
      Use the secure code below to complete registration and sign-in for
      <strong style="color:#ffffff;font-weight:600">${email}</strong>.
    </p>

    <!-- OTP digits -->
    <div class="otp-row">
      <table role="presentation" border="0" cellspacing="0" cellpadding="0">
      <tr>
        ${firstHalf}
        <td><span class="otp-sep" aria-hidden="true">&nbsp;</span></td>
        ${secondHalf}
      </tr>
      </table>
    </div>

    <p class="muted">
      This code expires in <span class="muted-accent">5 minutes</span>.
      If you did not request this verification, you can safely ignore this message.
    </p>

    <div class="divider"></div>
    <p class="footer">© ${new Date().getFullYear()} QuizMaster App. All rights reserved.</p>

  </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
};

export const getVerifyEmailHtml = ({ email, token }: any) => {
  const appName = process.env.APP_NAME || "QuizMaster";
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  // Verify path is now correctly matching dynamic route /verify/[token]
  const verifyUrl = `${baseUrl.replace(/\/+$/, "")}/verify/${encodeURIComponent(token)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>Confirm your ${appName} account</title>
<style>${BASE_STYLES}</style>
</head>
<body>
<table role="presentation" class="wrapper" width="100%" border="0" cellspacing="0" cellpadding="0">
<tr><td align="center">
  <table role="presentation" class="container" border="0" cellspacing="0" cellpadding="0">
  <tr><td class="card-body">

    <div class="accent-bar"></div>
    <p class="brand">${appName}</p>
    <h1 class="title">Confirm your account</h1>
    <p class="body-text">
      Thanks for signing up! Click the button below to verify your email address
      (<span style="color:#ffffff;font-weight:600">${email}</span>)
      and activate your QuizMaster account.
    </p>

    <!-- CTA -->
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:32px">
    <tr><td>
      <a class="btn" href="${verifyUrl}" target="_blank" rel="noopener">
        Verify Account &rarr;
      </a>
    </td></tr>
    </table>

    <p class="muted" style="margin-bottom:6px">Or copy and paste this link into your browser:</p>
    <a class="link" href="${verifyUrl}" target="_blank" rel="noopener">${verifyUrl}</a>

    <div class="divider"></div>
    <p class="muted" style="margin-bottom:20px">
      If you did not create a QuizMaster account, you can safely ignore this email.
    </p>
    <p class="footer">© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>

  </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
};

export const getForgotPasswordHtml = ({ email, token }: any) => {
  const appName = process.env.APP_NAME || "QuizMaster";
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  // Reset password path matches /reset-password/[token]
  const resetUrl = `${baseUrl.replace(/\/+$/, "")}/reset-password/${encodeURIComponent(token)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>Reset your ${appName} password</title>
<style>${BASE_STYLES}</style>
</head>
<body>
<table role="presentation" class="wrapper" width="100%" border="0" cellspacing="0" cellpadding="0">
<tr><td align="center">
  <table role="presentation" class="container" border="0" cellspacing="0" cellpadding="0">
  <tr><td class="card-body">

    <div class="accent-bar"></div>
    <p class="brand">${appName}</p>
    <h1 class="title">Reset your password</h1>
    <p class="body-text">
      We received a request to reset the password for your QuizMaster account
      (<span style="color:#ffffff;font-weight:600">${email}</span>).
      Click the button below to choose a new password.
    </p>

    <!-- CTA -->
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:32px">
    <tr><td>
      <a class="btn" href="${resetUrl}" target="_blank" rel="noopener">
        Reset Password &rarr;
      </a>
    </td></tr>
    </table>

    <p class="muted" style="margin-bottom:6px">Or copy and paste this link into your browser:</p>
    <a class="link" href="${resetUrl}" target="_blank" rel="noopener">${resetUrl}</a>

    <div class="divider"></div>
    <p class="muted" style="margin-bottom:20px">
      This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
    </p>
    <p class="footer">© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>

  </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
};