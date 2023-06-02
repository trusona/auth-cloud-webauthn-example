import { Component, ElementRef, OnInit, ViewChild } from '@angular/core'
import { environment } from '../environments/environment'
import { EnrollmentResult, Initializer, WebAuthnEnrollment } from '@trusona/webauthn'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('msg') msgContainer!: ElementRef;

  username: string = ''

  ngOnInit (): void {
    Initializer.initialize(environment.sdkId, environment.sdkEnvironment)
      .then(() => {
        console.log('initialized the sdk!')
      })
      .catch(() => {
        this.msgContainer.nativeElement.innerHTML = 'failed sdk initialization'
      })
  }

  submission (): void {
    if (this.username !== '') {
      this.jwtApi()
        .then((value) => {
          this.enrollment(value)
            .then((status) => {
              console.log(status)
            })
            .catch((error) => {
              this.msgContainer.nativeElement.innerHTML = error.message
            })
        })
        .catch(() => {
          this.msgContainer.nativeElement.innerHTML = 'failed to load JWT'
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
