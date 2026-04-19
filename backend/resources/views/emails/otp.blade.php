<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AlemnyPro Verification</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #F3F4F6;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            background-color: #F3F4F6;
            padding: 40px 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid #E5E7EB;
        }
        .header {
            background-color: #1B4965; /* AlemnyPro Premium Dark Blue */
            padding: 32px 40px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .content {
            padding: 48px 40px;
            text-align: right;
            color: #374151;
        }
        .greeting {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #111827;
        }
        .message {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 32px;
            color: #4B5563;
        }
        .otp-box {
            background-color: #F9FAFB;
            border: 2px dashed #D1D5DB;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin-bottom: 32px;
        }
        .otp-code {
            font-size: 42px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #1B4965;
            margin: 0;
            font-family: monospace;
        }
        .otp-label {
            font-size: 14px;
            color: #6B7280;
            margin-top: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }
        .warning {
            font-size: 14px;
            color: #9CA3AF;
            text-align: center;
            line-height: 1.5;
        }
        .footer {
            background-color: #F9FAFB;
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #E5E7EB;
            color: #6B7280;
            font-size: 13px;
        }
        .footer-link {
            color: #1B4965;
            text-decoration: none;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>AlemnyPro | علمني برو</h1>
            </div>
            
            <div class="content">
                <div class="greeting">مرحباً {{ $userName }}، 👋</div>
                
                <div class="message">
                    لقد تلقينا طلباً للتحقق من عنوان بريدك الإلكتروني في حسابك على منصة علمني برو. يرجى استخدام رمز التحقق التالي لإكمال العملية:
                </div>
                
                <div class="otp-box">
                    <div class="otp-code">{{ $otp }}</div>
                    <div class="otp-label">رمز التحقق الخاص بك</div>
                </div>
                
                <div class="message" style="text-align: center; font-weight: 500;">
                    ⏳ هذا الرمز صالح لمدة <strong>10 دقائق</strong> فقط.
                </div>
                
                <div class="warning">
                    إذا لم تقم بطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان. لم يتم إجراء أي تغييرات على حسابك.
                </div>
            </div>
            
            <div class="footer">
                © {{ date('Y') }} منصة علمني برو. جميع الحقوق محفوظة.<br>
                <a href="#" class="footer-link">تحتاج إلى مساعدة؟</a>
            </div>
        </div>
    </div>
</body>
</html>
