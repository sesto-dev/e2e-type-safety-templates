// src/openapi/openapi.service.ts
import { Injectable } from '@nestjs/common'

@Injectable()
export class OpenApiService {
  private document: any = null

  setDocument(document: any) {
    this.document = document
  }

  getDocument() {
    return this.document
  }
}
