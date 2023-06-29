import { Component, ElementRef, AfterContentInit, ViewChild } from '@angular/core'
import { environment } from '../environments/environment'
import { DefaultPreflightChecks, Preflight, EnrollmentResult, Initializer, WebAuthnAuthentication, WebAuthnEnrollment } from '@trusona/webauthn'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterContentInit {
  @ViewChild('msg') msgContainer!: ElementRef
  @ViewChild('submitBtn') submitContainer!: ElementRef

  username: string = ''
  disableUsername = false
  enrolled = false

  private webauthnFeatures!: Preflight

  canWebauthn: string = '🚫'
  hasPlatformAuthenticator: string = '🚫'
  canAutofill: string = '🚫'

  async ngAfterContentInit (): Promise<void> {
    Initializer.initialize(environment.sdkOrigin)
      .then(() => {
        console.log('initialized the sdk!')
      })
      .catch(() => {
        this.msgContainer.nativeElement.innerHTML = 'failed sdk initialization'
      })
    
      this.webauthnFeatures = await DefaultPreflightChecks.check()
      this.canWebauthn = this.webauthnFeatures.webauthn ? '✅' : '🚫'
      this.hasPlatformAuthenticator = this.webauthnFeatures.platformAuthenticator ? '✅' : '🚫'
      this.canAutofill = this.webauthnFeatures.conditionalMediation ? '✅' : '🚫'
  }

  submission (): void {
    if (this.enrolled) {
      this.authenticate()
    } else {
      this.enroll()
    }
  }

  reset (): void {
    location.reload()
  }

  authenticate (): void {
    const controller: AbortController = new AbortController()
    const usernameHint: string | undefined = this.username

    new WebAuthnAuthentication().authenticate(controller.signal, usernameHint)
      .then((map) => {
        // In production you *SHOULD* verify the id token with this JWKS
        // const jwksEndpoint: string = Initializer.jwksEndpoint
        const idToken: string = map.idToken
        const subject: string = JSON.parse(window.atob(idToken.split('.')[1])).sub

        const status = `You have successfully signed in as <span class="font-semibold text-purple-500">${subject}</span>.`

        this.msgContainer.nativeElement.innerHTML = status
        this.enrolled = true
        this.username = ''

        //
        // Verify the JWT against the Trusona's JWKS implementation endpoint.
        //
        // A "subject" claim will have the username of the authenticated user.
        //
      })
      .catch((error) => {
        this.msgContainer.nativeElement.innerHTML = error.message
      })
  }

  private enroll (): void {
    if (this.username !== '') {
      this.jwtApi()
        .then((value) => {
          this.enrollment(value)
            .then((_) => {
              this.msgContainer.nativeElement.innerHTML = 'You have successfully enrolled. Click on "Sign In".'
              this.submitContainer.nativeElement.innerHTML = 'Sign In'
              this.disableUsername = true
              this.enrolled = true
            })
            .catch((error) => {
              this.msgContainer.nativeElement.innerHTML = error.message
              this.disableUsername = false
            })
        })
        .catch(() => {
          this.msgContainer.nativeElement.innerHTML = 'failed to load JWT'
          this.disableUsername = true
        })
    }
  }

  private async enrollment (jwt: string): Promise<EnrollmentResult> {
    const controller: AbortController = new AbortController()
    return await new WebAuthnEnrollment().enroll(jwt, controller.signal)
  }

  private async jwtApi (): Promise<string> {
    try {
      const response = await fetch(`https://jwks-delegate.lab.trusona.net/jwt?sub=${this.username}`)
      const data = await response.json()
      return await Promise.resolve(data.jwt)
    } catch (e) {
      return await Promise.reject(e)
    }
  }
}
