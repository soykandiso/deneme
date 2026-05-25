import {
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Redirect,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';

@Controller({ path: '', version: '1' })
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Post('complaints/:id/attachments')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  upload(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-draft-token') draftToken: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.attachments.uploadToDraft({ complaintId: id, draftToken, file });
  }

  @Get('attachments/:id/download')
  @Redirect()
  async download(@Param('id', new ParseUUIDPipe()) id: string) {
    const url = await this.attachments.getPresignedPublicUrl(id);
    return { url, statusCode: 302 };
  }
}
