import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as crypto from 'crypto';

import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ServersModule } from '../servers/servers.module';

@Module({
  imports: [
    ConfigModule,
    ServersModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'temp');
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = crypto.randomBytes(16).toString('hex');
          const ext = path.extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Allowed file types for SA-MP servers
        const allowedTypes = [
          '.amx',     // Compiled gamemodes/filterscripts
          '.pwn',     // Pawn source files
          '.inc',     // Include files
          '.so',      // Linux plugins
          '.dll',     // Windows plugins
          '.cfg',     // Configuration files
          '.txt',     // Text files
          '.log',     // Log files
          '.db',      // Database files
          '.sql',     // SQL files
          '.lua',     // Lua scripts
          '.json',    // JSON files
          '.xml',     // XML files
          '.ini',     // INI files
        ];

        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(ext)) {
          cb(null, true);
        } else {
          cb(new Error(`Tipo de arquivo não permitido: ${ext}`), false);
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
        files: 10, // Max 10 files per upload
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}