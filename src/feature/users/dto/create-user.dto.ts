import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the user',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name!: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'The email of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The password of the user. Must be at least 8 characters long and contain at least one letter, one number, and one special character.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?~`]).*$/, {
    message: 'Password must contain at least one letter, one number, and one special character',
  })
  password!: string;
}
