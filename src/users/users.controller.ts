import { Controller, Get, Post, Delete, Res, HttpStatus, Body, Param, Query } from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Utils } from 'src/utils/Utils';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {};

  @Get('all')
  async findAll(@Query() queryParams, @Res() res: Response) {
    let { page, users } = queryParams;
    const pageWasNotSent = typeof page === 'undefined';
    const usersWasNotSent = typeof users === 'undefined';
    if(pageWasNotSent) {
      page = 1;
    };
    if(usersWasNotSent) {
      users = 10;
    };
    if(!Utils.isDigit(page) || !Utils.isDigit(users)) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Os parametros de consulta precisam ser numérico' })
    };
    const pageNumber = parseInt(page);
    const usersNumber = parseInt(users);
    const result = await this.usersService.findAll(pageNumber, usersNumber);
    return res.status(HttpStatus.ACCEPTED).json(result);
  };

  @Post('create')
  async create(@Body() payload: CreateUserDto, @Res() res: Response) {
    const userIsInvalid = Utils.validateUser(payload);
    if(userIsInvalid) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Dados do usuário estão inválidos.' });
    };
    const user = Utils.handleUser(payload);
    if(!Utils.isValidCPF(user.cpf)) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'CPF inválido.' })
    };
    const userAlreadyExists = await this.usersService.findByCPF(user.cpf);
    if(userAlreadyExists) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Usuário ja cadastrado.'})
    };
    const newUser = await this.usersService.create(user);
    return res.status(HttpStatus.CREATED).json(newUser);
  };

  @Get(':cpf/find-by-cpf')
  async findOneByCPF(@Param() params, @Res() res: Response) {
    const { cpf } = params;
    const normalizedCPF = Utils.normalizeOnlyNumbers(cpf);
    if(!Utils.isValidCPF(normalizedCPF)) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'CPF inválido.' })
    };
    const userFound = await this.usersService.findByCPF(normalizedCPF);
    if(!userFound) {
      return res.status(HttpStatus.NOT_FOUND).json({ error: 'Nenhum usuário encontrado com estes dados.' })
    };
    return res.status(HttpStatus.ACCEPTED).json(userFound);
  };

  @Delete(':id/delete')
  async delete(@Param() params, @Res() res: Response) {
    const { id } = params;
    const integer = parseInt(id);
    const result = await this.usersService.remove(integer);
    const userDeleted = result.affected > 0;
    if(!userDeleted) {
      return res.status(HttpStatus.NOT_FOUND).json({ error: 'Nenhum usuário deletado' });
    };
    return res.status(HttpStatus.ACCEPTED).json({ message: 'Usuário deletado com sucesso.' });
  };
};
