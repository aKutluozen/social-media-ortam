// Main modules
import { Injectable } from '@angular/core';

@Injectable()
export class MultiLanguageService {
    // This will be loaded from server when the language is selected
    public text = {
        general: {
            charsLeft: 'karater kaldi'
        },
        auth: {
            login: 'Giris yap',
            signup: 'Kayit ol',
            forgotPassword: 'Sifremi unuttum',
            forgotPasswordMessage: 'Sifrenizi mi unuttunuz? Sorun degil. Asagidaki adimlari takip edin, ve sifrenizi yenileyin!',
            enterEmail: 'E-mail adresinizi giriniz.',
            sendCode: 'Kodu gonder',
            enterCode: 'E-mail adresinize gonderdigimiz kodu giriniz.',
            enterNewPassword: 'Yeni sifreyi giriniz',
            changePassword: 'Sifreyi degistir',
            passwordRules: 'Sifreniz asagidaki kurallara uygun olmalidir:',
            passwordRule1: 'En az 8 karakter',
            passwordRule2: 'En az 1 kucuk harf',
            passwordRule3: 'En az 1 buyuk harf',
            passwordRule4: 'En az 1 sayi',
            passwordRule5: 'En az 1 ozel karakter (!@#$%^&*) icermelidir',
            placeHolderEmail: 'E-posta',
            placeHolderPassword: 'Sifre',
            placeHolderNewPassword: 'Yeni sifre',
            placeHolderNickname: 'Takma isim',
            placeHolderChatNickname: 'Rumuz (anonim sohbet)',
            placeHolderName: 'Isim',
            placeHolderLastname: 'Soy isim',
            placeHolderPasswordAgain: 'Sifreyi tekrar giriniz',
            placeHolderShortMessage: 'Kisa bir mesaj yaziniz (max. 128 karakter)',
            shortMessageMessage: 'Son olarak, nereden katildiginizi ve kim oldugunuzu anlatan kisa bir mesaj ile Kutatku\'ya merhaba deyin! Dilerseniz, daha sonra bu mesaji dilediginiz gibi degistirebilirsiniz. <i>(Max 256 karakter)</i>',
            whyNameLastnameMessage: 'Isim ve soyismi doldurmak, arkadas aramalarinda kolay bulunabilmeniz icin tavsiye olunur. Kalan bilgileri hesabinizi actiktan sonra doldurabilirsiniz.'
        },
        navigation: {
            homepage: 'Ana sayfa',
            classifieds: 'Ilanlar',
            help: 'Yardim',
            profile: 'Hesap',
            gotoprofile: 'Hesaba git',
            logout: 'Cikis yap'
        },
        search: {
            resultsFound: 'sonuc bulundu',
            search: 'Arkadas ara'
        },
        inbox: {
            privateMessages: 'Ozel Mesajlar',
            notifications: 'Bildirimler',
            requests: 'Istekler',
            chat: 'Canli Sohbet',
            sentRequest: 'Takip istegi yolladi',
            noRequestFound: 'Hic bir istek bulunamadi',
            noMessageFound: 'Hic bir mesaj bulunamadi',
            noNotificationFound: 'Hic bir bildirim bulunamadi',
            selectRoom: 'Oda seciniz',
            inviteToPrivate: 'Ozel sohbete cagir',
            showMore: 'Daha yukle',
            complain: 'Sikayet et',
            selectColor: 'Renk secin',
            black: 'siyah',
            red: 'kirmizi',
            purple: 'mor',
            yellow: 'sari',
            green1: 'yesil 1',
            green2: 'yesil 2',
            gray: 'gri',
            lightGray: 'acik gri',
            darkBlue: 'lacivert',
            blue: 'mavi',
            orange: 'turuncu',
            complaintReason: 'Sebep (max. 100 karakter)'
        },
        errors: {
            inbox: {
                problem: 'Mesajlar ve istekler goruntulenirken bir sorun olustu',
            },
            user: {
                problem: 'Profil yuklenirken bir sorun olustu',
            },
            post: {
                problem: 'Gonderi yuklenirken bir sorun olustu'
            }
        }
    }
}
