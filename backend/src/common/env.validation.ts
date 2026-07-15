import { plainToInstance } from 'class-transformer';
import { validateSync, IsEnum, IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export enum StorageProvider {
  LOCAL = 'local',
  IPFS = 'ipfs',
  GCS = 'gcs',
  S3 = 's3',
}

class EnvironmentVariables {
  @IsNotEmpty({ message: 'DATABASE_URL is required' })
  @IsString()
  DATABASE_URL: string;

  @IsOptional()
  @IsString()
  DIRECT_URL?: string;

  @IsNotEmpty({ message: 'JWT_SECRET is required' })
  @IsString()
  JWT_SECRET: string;

  @IsOptional()
  @IsNumber({}, { message: 'PORT must be a number' })
  PORT?: number;

  @IsOptional()
  @IsString()
  FRONTEND_URL?: string;

  @IsOptional()
  @IsString()
  RPC_URL?: string;

  @IsOptional()
  @IsString()
  CHAIN_ID?: string;

  @IsOptional()
  @IsString()
  NFT_CONTRACT_ADDRESS?: string;

  @IsOptional()
  @IsEnum(StorageProvider, { message: 'STORAGE_PROVIDER must be local, ipfs, gcs, or s3' })
  STORAGE_PROVIDER?: StorageProvider;
}

export function validateEnv(): void {
  const config = process.env;
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  const validationErrors: string[] = [];

  if (errors.length > 0) {
    errors.forEach((err) => {
      if (err.constraints) {
        validationErrors.push(...Object.values(err.constraints));
      }
    });
  }

  // Custom checks for production safety
  const isProd = config.NODE_ENV === 'production';
  if (isProd) {
    // 1. Verify DATABASE_URL format
    if (config.DATABASE_URL && !config.DATABASE_URL.startsWith('postgresql://') && !config.DATABASE_URL.startsWith('postgres://')) {
      validationErrors.push('Production DATABASE_URL must start with postgresql:// or postgres://');
    }

    // 2. Verify JWT Secret is not a placeholder
    const unsafeSecrets = [
      'wcos_super_secret_jwt_key_change_in_production_2026',
      'wcos-super-secret-key-change-in-prod',
      'wcos_local_secret_jwt_key_do_not_use_in_prod_12345',
      'wcos_dev_secret_key_needs_rotation',
      'wcos_test_jwt_secret',
      'wcos_staging_secret_key_from_secret_manager'
    ];
    if (config.JWT_SECRET && unsafeSecrets.includes(config.JWT_SECRET)) {
      validationErrors.push('Production JWT_SECRET cannot be a known default placeholder value.');
    }

    // 3. Verify Frontend URL is not localhost
    if (config.FRONTEND_URL && (config.FRONTEND_URL.includes('localhost') || config.FRONTEND_URL.includes('127.0.0.1'))) {
      validationErrors.push('Production FRONTEND_URL cannot point to localhost/127.0.0.1.');
    }

    // 4. Verify RPC URL is not localhost
    if (config.RPC_URL && (config.RPC_URL.includes('localhost') || config.RPC_URL.includes('127.0.0.1'))) {
      validationErrors.push('Production RPC_URL cannot point to localhost/127.0.0.1.');
    }
  }

  if (validationErrors.length > 0) {
    console.error('\n❌ ──────────────────────────────────────────────────────────────');
    console.error('❌ ENVIRONMENT VALIDATION FAILED (FAIL-FAST INITIATED)');
    console.error('❌ ──────────────────────────────────────────────────────────────');
    validationErrors.forEach((err) => console.error(`   - ${err}`));
    console.error('❌ ──────────────────────────────────────────────────────────────\n');
    process.exit(1);
  }
}
