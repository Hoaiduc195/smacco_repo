import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';

@ApiTags('Questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('place/:placeId')
  @ApiOperation({ summary: 'Get question threads for a place' })
  listByPlace(@Param('placeId') placeId: string) {
    return this.questionsService.listByPlace(placeId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Create a new question for a place' })
  create(@Body() dto: CreateQuestionDto, @Req() request: any) {
    return this.questionsService.createQuestion(dto, request.user);
  }

  @Post(':questionId/answers')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Post a user answer for a question' })
  createAnswer(@Param('questionId') questionId: string, @Body() dto: CreateAnswerDto, @Req() request: any) {
    return this.questionsService.createAnswer(questionId, dto, request.user);
  }

  @Delete(':questionId')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete own question' })
  removeQuestion(@Param('questionId') questionId: string, @Req() request: any) {
    return this.questionsService.deleteQuestion(questionId, request.user);
  }
}