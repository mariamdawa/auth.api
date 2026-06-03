import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from 'node_modules/@nestjs/swagger/dist/decorators/api-property.decorator';
export class LogoutDto {
  @ApiProperty({
    description: 'The refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJzdWIiOiI2NDg3YjEwZDE4YjA0MDAxODg0ODg1IiwianRpIjoiNWQyYjE3YjAtZDE4OS00N2E5LTg0ODQtYjA4ZDUzZDEyMzkiLCJpYXQiOjE2OTQ4MDk0MDAsImV4cCI6MTY5NDgwOTcwMH0.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890',
  })
  @IsUUID()
  @IsNotEmpty()
  jti!: string;
}