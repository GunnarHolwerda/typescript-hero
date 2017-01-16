import { Initializable } from './Initializable';
import { Logger } from './utilities/Logger';
import { Container as IoCContainer } from 'inversify';

const container = new IoCContainer();

container.bind<Initializable>('ServerParts').to(Logger).inSingletonScope();

export const Container = container;
