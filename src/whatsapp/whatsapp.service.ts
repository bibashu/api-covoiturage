import {
  Injectable, Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly logger:   Logger        = new Logger(WhatsAppService.name);
  private readonly http:     AxiosInstance;
  private readonly phoneId:  string;
  private readonly template: string;
  private readonly lang:     string;

  constructor(private readonly config: ConfigService) {
    // ✅ Fallback '' pour éviter "undefined not assignable to string"
    this.phoneId  = config.get<string>('WHATSAPP_PHONE_NUMBER_ID') ?? '';
    this.template = config.get<string>('WHATSAPP_OTP_TEMPLATE') ?? 'covoiturage_otp';
    this.lang     = config.get<string>('WHATSAPP_LANG') ?? 'fr';

    this.http = axios.create({
      baseURL: 'https://graph.facebook.com/v21.0',
      headers: {
        Authorization: `Bearer ${config.get<string>('WHATSAPP_TOKEN') ?? ''}`,
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
    });
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    console.log('code', code)
    const to = phone.replace(/[^0-9]/g, '');

  const payload = {
  messaging_product: 'whatsapp',
  to,
  type: 'template',
  template: {
    name: this.template, // "authentication"
    // language: { code:U this.lang },
  language: { code: 'en_US' },
    components: [
      // {
      //   type: 'body',
      //   parameters: [
      //     { type: 'text', text: code },
      //   ],
      // },
      // {
      //   type: 'button',
      //   sub_type: 'url',
      //   index: '0',
      //   parameters: [
      //     { type: 'text', text: code },
      //   ],
      // },
    ],
  },
};

    try {
      const { data } = await this.http.post(`/${this.phoneId}/messages`, payload);
      console.log('data', data)
      const msgId = (data?.messages?.[0]?.id as string | undefined) ?? '—';
      this.logger.log(`OTP WhatsApp envoyé → +${to} (msgId: ${msgId})`);
    } catch (err: any) {
      const detail = err?.response?.data?.error as { message?: string } | undefined;
      this.logger.error(`Échec WhatsApp +${to} : ${detail?.message ?? (err as Error).message}`);
      throw new InternalServerErrorException(
        "Impossible d'envoyer le code WhatsApp. Vérifiez votre numéro.",
      );
    }
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = this.config.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN') ?? '';
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook WhatsApp vérifié ✅');
      return challenge;
    }
    return null;
  }

  processWebhook(body: any): void {
    const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages as any[] | undefined;
    if (messages?.length) {
      this.logger.log(`Message WhatsApp entrant : ${JSON.stringify(messages[0])}`);
    }
  }
}